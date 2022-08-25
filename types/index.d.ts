interface AsyncPromise<T = any> extends Promise<T> {
    resolve: PromiseConstructor['resolve'];
    reject: PromiseConstructor['reject'];
}
declare function createAsyncPromise<T>(executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): AsyncPromise<T>;
interface IndexedDBAsyncTableMetaIndex {
    name: string;
    key?: string;
    unique?: boolean;
}
declare type IndexedDBAsyncTableMetaIndexes = IndexedDBAsyncTableMetaIndex[];
interface IndexedDBAsyncTableMeta {
    name: string;
    key: string;
    autoIncrement?: boolean;
    indexes?: IndexedDBAsyncTableMetaIndex[];
}
declare type IndexedDBAsyncTableMetas = IndexedDBAsyncTableMeta[];
declare type KeyPath = IDBValidKey | IDBKeyRange;
declare type SetResultAction<S = any> = S | PromiseLike<S> | ((prevState: S) => S);
declare type DBCursorNext<T> = (value: T, list: T[]) => void | boolean;
declare type OpenCursorOptions<T> = {
    direction?: IDBCursorDirection;
    indexName?: string;
    next?: DBCursorNext<T>;
};
declare class IndexedDBAsync {
    private _db?;
    readonly name: string;
    readonly version: number;
    readonly tables: IndexedDBAsyncTableMeta[];
    constructor(name: string, version: number, tables: IndexedDBAsyncTableMeta[]);
    get db(): Promise<IDBDatabase>;
    transaction<S = any>(tableNames: string | string[], mode: IDBTransactionMode, onComplete?: (result: S) => void, onError?: (error: any) => void): Promise<[IDBTransaction, (result: SetResultAction<S>) => S]>;
    put<T extends Array<any>>(tableName: string, ...values: T): Promise<T>;
    get<T = any, K extends KeyPath = KeyPath>(tableName: string, keyPathList: K): Promise<T>;
    all<T = any, K extends KeyPath = KeyPath>(tableName: string, query?: K, limit?: number, indexName?: string): Promise<T[]>;
    keys<T extends IDBValidKey = string>(tableName: string, query?: KeyPath, limit?: number, indexName?: string): Promise<T[]>;
    query<T>(tableName: string, query: KeyPath, options?: OpenCursorOptions<T>): Promise<T[]>;
    queryKeys<T>(tableName: string, query: KeyPath, options?: OpenCursorOptions<T>): Promise<T[]>;
    count(tableName: string): Promise<number>;
    clear(tableName: string): Promise<void>;
    delete(tableName: string, queryList: KeyPath | KeyPath[], options?: {
        indexName?: string | string[];
        limit?: number;
    }): Promise<number>;
}
export { createAsyncPromise, IndexedDBAsyncTableMetaIndex, IndexedDBAsyncTableMetaIndexes, IndexedDBAsyncTableMeta, IndexedDBAsyncTableMetas, };
export default IndexedDBAsync;
