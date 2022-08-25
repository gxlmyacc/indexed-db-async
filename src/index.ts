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


interface IndexedDBAsyncTableMetaIndex {
  name: string,
  key?: string,
  unique?: boolean,
}
type IndexedDBAsyncTableMetaIndexes = IndexedDBAsyncTableMetaIndex[];

interface IndexedDBAsyncTableMeta {
  name: string,
  key: string,
  autoIncrement?: boolean;
  indexes?: IndexedDBAsyncTableMetaIndex[]
}

type IndexedDBAsyncTableMetas = IndexedDBAsyncTableMeta[];

type KeyPath = IDBValidKey | IDBKeyRange;

type SetResultAction<S = any> = S | PromiseLike<S> | ((prevState: S) => S);
type SetResultCallback<S = any> = (result?: SetResultAction<S>) =>  S

function getAll<T>(
  proxy: IndexedDBAsync,
  method: 'getAll'|'getAllKeys',
  tableName: string,
  query?: IDBValidKey | IDBKeyRange,
  limit?: number,
  indexName?: string
) {
  return new Promise<T[]>((resolve, reject) => {
    proxy.transaction(tableName, 'readonly', resolve, reject)
      .then(([transaction, setResult]) => {
        const prom = createAsyncPromise<T[]>();
        setResult(prom);

        let table = transaction.objectStore(tableName);
        const req = (indexName ? table.index(indexName) : table)[method](query, limit);
        req.onsuccess = () => prom.resolve(req.result);
        req.onerror = () => prom.reject(req.error);

        transaction.commit();
      }).catch(reject);
  });
}

type DBCursorNext<T> = (value: T, list: T[]) => void|boolean;
type OpenCursorOptions<T> = {
  direction?: IDBCursorDirection,
  indexName?: string,
  next?: DBCursorNext<T>,
}

function openCursor<T>(
  proxy: IndexedDBAsync,
  method: 'openCursor'|'openKeyCursor',
  tableName: string,
  valueKey: 'value'|'key',
  query: IDBValidKey | IDBKeyRange,
  options?: OpenCursorOptions<T>
) {
  return new Promise<T[]>((resolve, reject) => {
    proxy.transaction<AsyncPromise<T[]>>(tableName, 'readonly', resolve, reject)
      .then(([transaction, setResult]) => {
        let prom = setResult(createAsyncPromise<T[]>());
        let table = transaction.objectStore(tableName);
        const { indexName, direction, next } = options || {};

        const req = (indexName ? table.index(indexName) : table)[method](query, direction) as IDBRequest<IDBCursorWithValue>;

        let result: T[] = [];
        req.onsuccess = event => {
          const cursor = (event.target as any).result as IDBCursorWithValue;
          if (!cursor) {
            return prom.resolve(result);
          }
          let value = cursor[valueKey];
          result.push(value);
          let isContinue = !next || (next(value, result) !== false);
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
  callback: ([Transferable, setResult, promise]: [IDBObjectStore, SetResultCallback<T>, AsyncPromise<T>]) => void|PromiseLike<void>
) {
  const prom = createAsyncPromise<T>();
  proxy.transaction(tableName, mode, prom.resolve, prom.reject)
    .then(([transaction, setResult]) => {
      const table = transaction.objectStore(tableName);
      let ret = callback([table, setResult as any, prom]);
      if (ret && ret.then) {
        return ret.then(() => transaction.commit());
      }
      transaction.commit();
    }).catch(prom.reject);
  return prom;
}

class IndexedDBAsync {

  private _db?: IDBDatabase|Error;

  public readonly name: string;

  public readonly version: number;

  public readonly tables: IndexedDBAsyncTableMeta[];

  constructor(name: string, version: number, tables: IndexedDBAsyncTableMeta[]) {
    if (!indexedDB) {
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

  put<T extends Array<any>>(tableName: string, ...values: T): Promise<T> {
    return transactionTable<T>(
      this,
      tableName,
      'readwrite',
      ([table, setResult]) => {
        setResult(values);
        values.forEach(value => table.put(value));
      }
    );
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

  all<T = any, K extends KeyPath = KeyPath>(tableName: string, query?: K, limit?: number, indexName?: string): Promise<T[]> {
    return getAll<T>(this, 'getAll', tableName, query, limit, indexName);
  }

  keys<T extends IDBValidKey = string>(tableName: string, query?: KeyPath, limit?: number, indexName?: string): Promise<T[]> {
    return getAll<T>(this, 'getAllKeys', tableName, query, limit, indexName);
  }

  query<T>(tableName: string, query: KeyPath, options?: OpenCursorOptions<T>): Promise<T[]> {
    return openCursor<T>(this, 'openCursor', tableName, 'value', query, options);
  }

  queryKeys<T>(tableName: string, query: KeyPath, options?: OpenCursorOptions<T>): Promise<T[]> {
    return openCursor<T>(this, 'openKeyCursor', tableName, 'key', query, options);
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

  delete(tableName: string, queryList: KeyPath|KeyPath[], options?: {
    indexName?: string|string[],
    limit?: number
  }): Promise<number> {
    return transactionTable(
      this,
      tableName,
      'readwrite',
      ([table, setResult, prom]) => {
        setResult(0);
        const { indexName, limit } = options || {};
        if (!Array.isArray(queryList)) queryList = [queryList];
        if (indexName) {
          queryList = queryList.map((keyPath, i) => new Promise((resolve, reject) => {
            const index = table.index(Array.isArray(indexName) ? indexName[i] : indexName);
            const req = index.getAllKeys(keyPath, limit);
            req.onsuccess = () => resolve(req.result);
            req.onerror = event => reject(new Error('index getAllKeys failed ' + (event as any).errorCode + '.'));
          })) as any;
        }
        const _delete = (query: any) => {
          const req = table.delete(query);
          req.onsuccess  = () => setResult(result => ++result);
          req.onerror = event => prom.reject(new Error('table delete failed ' + (event as any).errorCode + '.'));
        };
        (queryList as KeyPath[]|PromiseLike<KeyPath[]>[]).forEach(query => {
          if (((query as PromiseLike<KeyPath[]>)).then) {
            (query as PromiseLike<KeyPath[]>).then(keyPathList => keyPathList.forEach(v => _delete(v)));
            return;
          }
          _delete(query);
        });
      }
    );
  }

}

export {
  createAsyncPromise,

  IndexedDBAsyncTableMetaIndex,
  IndexedDBAsyncTableMetaIndexes,

  IndexedDBAsyncTableMeta,
  IndexedDBAsyncTableMetas,
};

export default IndexedDBAsync;
