interface AsyncPromise<T = any> extends Promise<T> {
    resolve: PromiseConstructor['resolve'];
    reject: PromiseConstructor['reject'];
}
declare function createAsyncPromise<T>(executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): AsyncPromise<T>;
interface TableMetaIndex {
    name: string;
    key?: string;
    unique?: boolean;
}
declare type TableMetaIndexList = TableMetaIndex[];
interface TableMeta {
    name: string;
    key: string;
    autoIncrement?: boolean;
    indexes?: TableMetaIndexList;
}
declare type TableMetaList = TableMeta[];
declare type KeyPath = IDBValidKey | IDBKeyRange;
declare type SetResultAction<S = any> = S | PromiseLike<S> | ((prevState: S) => S);
declare function makeRange(rangeText: string, onKey?: ((key: string) => void)): IDBKeyRange;
declare type DBCursorNext<T> = number | ((value: T, list: T[]) => void | boolean);
declare const isSupportIndexedDB: () => boolean;
declare class IndexedDBAsync {
    private _db?;
    readonly name: string;
    readonly version: number;
    readonly tables: TableMetaList;
    constructor(name: string, version: number, tables: TableMetaList);
    get db(): Promise<IDBDatabase>;
    range: typeof makeRange;
    transaction<S = any>(tableNames: string | string[], mode: IDBTransactionMode, onComplete?: (result: S) => void, onError?: (error: any) => void): Promise<[IDBTransaction, (result: SetResultAction<S>) => S]>;
    add<T>(tableName: string, values: T | T[]): AsyncPromise<number>;
    put<T>(tableName: string, values: T | T[]): AsyncPromise<number>;
    get<T = any, K extends KeyPath = KeyPath>(tableName: string, keyPathList: K): Promise<T>;
    all<T = any, K extends KeyPath = KeyPath>(tableName: string, query?: K, limit?: number): Promise<T[]>;
    keys<T extends IDBValidKey = string>(tableName: string, query?: KeyPath, limit?: number): Promise<T[]>;
    query<T>(tableName: string, query?: KeyPath, nextOrLimit?: DBCursorNext<T>, direction?: IDBCursorDirection): Promise<T[]>;
    queryKeys<T>(tableName: string, query?: KeyPath, nextOrLimit?: DBCursorNext<T>, direction?: IDBCursorDirection): Promise<T[]>;
    count(tableName: string): Promise<number>;
    clear(tableName: string): Promise<void>;
    delete(tableName: string, keyOrKeyList: KeyPath | KeyPath[], limit?: number): Promise<void>;
    deleteRange(tableName: string, query: string | IDBKeyRange, limit?: number): Promise<void>;
    destory(): Promise<void>;
}
export { isSupportIndexedDB, createAsyncPromise, TableMetaIndex, TableMetaIndexList, TableMeta, TableMetaList, };
export default IndexedDBAsync;
