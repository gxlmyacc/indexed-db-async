interface AsyncPromise<T = any> extends Promise<T> {
  resolve: PromiseConstructor['resolve'],
  reject: PromiseConstructor['reject'],
}

function createAsyncPromise<T>(
  executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void
): AsyncPromise<T> {
  let extra = {};
  const prom = new Promise((resolve, reject) => {
    extra = { resolve, reject };
    return executor && executor(resolve, reject);
  });
  Object.assign(prom, extra);
  return prom as AsyncPromise<T>;
}


interface TableMetaIndex {
  name: string,
  key?: string,
  unique?: boolean,
}
type TableMetaIndexList = TableMetaIndex[];

interface TableMeta {
  name: string,
  key: string,
  autoIncrement?: boolean;
  indexes?: TableMetaIndexList
}

type TableMetaList = TableMeta[];

type KeyPath = IDBValidKey | IDBKeyRange;

type SetResultAction<S = any> = S | PromiseLike<S> | ((prevState: S) => S);
type SetResultCallback<S = any> = (result?: SetResultAction<S>) =>  S

const isString = (str: any): str is string => typeof str === 'string';

function makeRange(rangeText: string, onKey?: ((key: string) => void)) {
  const [, key, opera1, value1, opera2 = '', value2] = rangeText.match(RangeRegex) || [];
  if (key && onKey) onKey(key);
  type OperaItem = { v: string, o: any };
  let eq: undefined|OperaItem;
  if (opera1) {
    const operaList: OperaItem[] = [
      { o: opera1, v: value1 },
      { o: opera2, v: value2 },
    ].filter(v => {
      if (!v.o) return;
      try { v.v = JSON.parse(v.v); } catch (error) { console.warn(error); }
      return true;
    });
    let lower = operaList.find(v => v.o[0] === '>');
    let upper = operaList.find(v => v.o[0] === '<');
    eq = operaList.find(v => v.o[0] === '=');
    if (upper && lower) {
      return IDBKeyRange.bound(lower.v, upper.v, !lower.o[1], !upper.o[1]);
    }
    if (upper) return IDBKeyRange.upperBound(upper.v, !upper.o[1]);
    if (lower) return IDBKeyRange.lowerBound(lower.v, !lower.o[1]);
  }

  return IDBKeyRange.only(eq ? eq.v : rangeText);
}

function getAll<T>(
  proxy: IndexedDBAsync,
  method: 'getAll'|'getAllKeys',
  tableName: string,
  query?: IDBValidKey | IDBKeyRange,
  limit?: number
) {
  return new Promise<T[]>((resolve, reject) => {
    proxy.transaction(tableName, 'readonly', resolve, reject)
      .then(([transaction, setResult]) => {
        const prom = createAsyncPromise<T[]>();
        setResult(prom);

        let indexName = '';
        if (isString(query)) query = makeRange(query, key => indexName = key);

        let table = transaction.objectStore(tableName);
        const req = (indexName ? table.index(indexName) : table)[method](query, limit);
        req.onsuccess = () => prom.resolve(req.result);
        req.onerror = () => prom.reject(req.error);

        transaction.commit();
      }).catch(reject);
  });
}

type DBCursorNext<T> = number|((value: T, list: T[]) => void|boolean);

function openCursor<T>(
  proxy: IndexedDBAsync,
  method: 'openCursor'|'openKeyCursor',
  tableName: string,
  valueKey: 'value'|'key',
  query?: IDBValidKey | IDBKeyRange,
  nextOrLimit?: DBCursorNext<T>,
  direction?: IDBCursorDirection,
) {
  return new Promise<T[]>((resolve, reject) => {
    proxy.transaction<AsyncPromise<T[]>>(tableName, 'readonly', resolve, reject)
      .then(([transaction, setResult]) => {
        let prom = setResult(createAsyncPromise<T[]>());
        let table = transaction.objectStore(tableName);

        let indexName = '';
        if (isString(query)) query = makeRange(query, key => indexName = key);
        const req = (indexName ? table.index(indexName) : table)[method](query, direction) as IDBRequest<IDBCursorWithValue>;

        let result: T[] = [];
        req.onsuccess = event => {
          const cursor = (event.target as any).result as IDBCursorWithValue;
          if (!cursor) {
            return prom.resolve(result);
          }
          let value = cursor[valueKey];
          result.push(value);
          if (typeof nextOrLimit === 'number') nextOrLimit--;
          let isContinue = !nextOrLimit || (typeof nextOrLimit !== 'function') || (nextOrLimit(value, result) !== false);
          if (isContinue) cursor.continue();
        };
        req.onerror = () => prom.reject(req.error);
      }).catch(reject);
  });
}

function transactionTable<T = any>(
  proxy: IndexedDBAsync,
  tableName: string,
  mode: IDBTransactionMode,
  callback: ([Transferable, setResult, promise]: [IDBObjectStore, SetResultCallback<T>, AsyncPromise<T>]) => void|PromiseLike<any>
) {
  const prom = createAsyncPromise<T>();
  proxy.transaction(tableName, mode, prom.resolve, prom.reject)
    .then(([transaction, setResult]) => {
      const table = transaction.objectStore(tableName);
      let ret = callback([table, setResult as any, prom]);
      if (mode !== 'readonly') {
        if (ret && ret.then) {
          return ret.then(() => transaction.commit());
        }
        transaction.commit();
      }
    }).catch(prom.reject);
  return prom;
}

function dbSave<T>(proxy: IndexedDBAsync, tableName: string, method: 'add'|'put', values: T|T[]) {
  return transactionTable<number>(
    proxy,
    tableName,
    'readwrite',
    ([table, setResult]) => {
      if (!Array.isArray(values)) values = [values] as any;
      setResult((values as any as T[]).length);
      (values as any as T[]).forEach(value => table[method](value));
    }
  );
}

function dbDeleteByKey(
  proxy: IndexedDBAsync,
  tableName: string,
  queryList: KeyPath|KeyPath[],
  limit?: number,
): Promise<void> {
  return transactionTable(
    proxy,
    tableName,
    'readwrite',
    ([table, setResult, prom]) => {
      if (!Array.isArray(queryList)) queryList = [queryList];
      const _delete = (query: any) => {
        const req = table.delete(query);
        req.onerror = event => prom.reject(event);
      };
      queryList.forEach(query => _delete(query));
    }
  );
}

function dbDeleteByQuery(
  proxy: IndexedDBAsync,
  tableName: string,
  query: string|IDBKeyRange,
  limit?: number,
): Promise<void> {
  return getAll<KeyPath>(proxy, 'getAllKeys', tableName, query, limit).then(keys => dbDeleteByKey(proxy, tableName, keys, limit));
}

const indexedDB = window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB;
const isSupportIndexedDB = () => Boolean(indexedDB);

const RangeRegex = /^(?:([A-Za-z0-9_$#-]+) *)?([><]=?) *([^ ]+)(?: *&& *([><]=?) *(.+))?$/;

class IndexedDBAsync {

  private _db?: IDBDatabase|Error;

  public readonly name: string;

  public readonly version: number;

  public readonly tables: TableMetaList;

  constructor(name: string, version: number, tables: TableMetaList) {
    if (!isSupportIndexedDB()) {
      throw new Error('not support indexedDB!');
    }
    this.name = name;
    this.version = version || 1;
    this.tables = tables;
  }

  get db(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this._db) {
        return this._db instanceof Error ? reject(this._db) : resolve(this._db);
      }

      const req = indexedDB.open(this.name, this.version);
      req.onupgradeneeded = event => {
        let db = this._db = (event.target as any).result as IDBDatabase;

        // delete not defined tables
        let tableCount = db.objectStoreNames.length;
        let deleteTables = [];
        for (let i = 0; i < tableCount; i++) {
          let tableName = db.objectStoreNames[i];
          if (this.tables.some(v => v.name === tableName)) continue;
          deleteTables.push(tableName);
        }
        deleteTables.forEach(tableName => db.deleteObjectStore(tableName));

        // create tables/indexes
        this.tables.forEach(table => {
          let tableStore: IDBObjectStore = null as any;
          let transaction;
          if (db.objectStoreNames.contains(table.name)) {
            transaction = db.transaction([table.name], 'readwrite');
            tableStore = transaction.objectStore(table.name);
          }
          if (!tableStore) {
            tableStore = db.createObjectStore(table.name, { keyPath: table.key, autoIncrement: table.autoIncrement });
          }

          // create index
          if (table.indexes) {
            let indexCount = tableStore.indexNames.length;
            let deleteIndexes = [];
            for (let i = 0; i < indexCount; i++) {
              let indexName = tableStore.indexNames[i];
              let newIndex = table.indexes.find(v => v.name === indexName);
              if (newIndex) {
                const oldIndex = tableStore.index(indexName);
                if (oldIndex.unique === Boolean(newIndex.unique)) continue;
              }
              deleteIndexes.push(indexName);
            }
            deleteIndexes.forEach(indexName => tableStore.deleteIndex(indexName));

            table.indexes.forEach(index => {
              let name = index.name;
              if (tableStore.indexNames.contains(name)) return;
              tableStore.createIndex(name, index.key || name, { unique: index.unique });
            });
          }
          if (transaction) transaction.commit();
        });
      };
      req.onsuccess = event => {
        this._db = (event.target as any).result;
        resolve(this._db as IDBDatabase);
      };
      req.onerror = event => {
        this._db = new Error('create indexedDB failed ' + (event.target as any).errorCode + '.');
        reject(this._db);
      };
    });
  }

  range = makeRange;

  transaction<S = any>(
    tableNames: string|string[],
    mode: IDBTransactionMode,
    onComplete?: (result: S) => void,
    onError?: (error: any) => void,
  ): Promise<[IDBTransaction, (result: SetResultAction<S>) => S]> {
    return this.db.then<any>(db => {
      try {
        if (!Array.isArray(tableNames)) tableNames = [tableNames];
        let transaction = db.transaction(tableNames, mode);
        let result: S;
        transaction.oncomplete = () => onComplete && onComplete(result);
        transaction.onerror = () => onError && onError(transaction.error || new Error('transaction failed'));
        transaction.onabort = () => onError && onError(transaction.error || new Error('transaction abort'));
        if (!transaction.commit) transaction.commit = () => {};
        return [transaction, (v: S) => result = typeof v === 'function' ? v(result) : v];
      } catch (ex) {
        if (onError) return onError(ex);
        console.error(ex);
      }
    }).catch(onError);
  }

  add<T>(tableName: string, values: T|T[]) {
    return dbSave(this, tableName, 'add', values);
  }

  put<T>(tableName: string, values: T|T[]) {
    return dbSave(this, tableName, 'put', values);
  }

  get<T = any, K extends KeyPath = KeyPath>(tableName: string, keyPathList: K): Promise<T>

  get<T = any, K extends KeyPath[] = KeyPath[]>(tableName: string, keyPathList: K[]): Promise<Array<T>> {
    return transactionTable(
      this,
      tableName,
      'readonly',
      ([table, setResult]) => {
        let result = setResult(Array.isArray(keyPathList) ? [] : undefined);

        if (!Array.isArray(keyPathList)) keyPathList = [keyPathList];
        keyPathList.forEach((keyPath, i) => {
          let req = table.get(keyPath as any);
          req.onsuccess = () => {
            if (Array.isArray(result)) result[i] = req.result;
            else setResult(req.result);
          };
        });
      }
    );
  }

  all<T = any, K extends KeyPath = KeyPath>(tableName: string, query?: K, limit?: number): Promise<T[]> {
    return getAll<T>(this, 'getAll', tableName, query, limit);
  }

  keys<T extends IDBValidKey = string>(tableName: string, query?: KeyPath, limit?: number): Promise<T[]> {
    return getAll<T>(this, 'getAllKeys', tableName, query, limit);
  }

  query<T>(tableName: string, query?: KeyPath, nextOrLimit?: DBCursorNext<T>, direction?: IDBCursorDirection) {
    return openCursor<T>(this, 'openCursor', tableName, 'value', query, nextOrLimit, direction);
  }

  queryKeys<T>(tableName: string, query?: KeyPath, nextOrLimit?: DBCursorNext<T>, direction?: IDBCursorDirection) {
    return openCursor<T>(this, 'openKeyCursor', tableName, 'key', query, nextOrLimit, direction);
  }

  count(tableName: string): Promise<number> {
    return transactionTable<number>(
      this,
      tableName,
      'readonly',
      ([table, setResult]) => {
        setResult(0);
        const req = table.count();
        req.onsuccess = () => setResult(req.result);
      }
    );
  }

  clear(tableName: string): Promise<void> {
    return transactionTable<void>(
      this,
      tableName,
      'readwrite',
      ([table]) => {
        table.clear();
      }
    );
  }

  delete(tableName: string, keyOrKeyList: KeyPath|KeyPath[], limit?: number) {
    return dbDeleteByKey(this, tableName, keyOrKeyList, limit);
  }

  deleteRange(tableName: string, query: string|IDBKeyRange, limit?: number) {
    return dbDeleteByQuery(this, tableName, query, limit);
  }

  async destory() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.onsuccess = () => {
        this._db = undefined;
        resolve();
      };
      request.onerror = reject;
    });
  }

}

export {
  isSupportIndexedDB,
  createAsyncPromise,

  TableMetaIndex,
  TableMetaIndexList,

  TableMeta,
  TableMetaList,
};

export default IndexedDBAsync;
