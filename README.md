# indexed-db-async

oprea indexed-db with promise.

[![NPM version](https://img.shields.io/npm/v/indexed-db-async.svg?style=flat)](https://npmjs.com/package/indexed-db-async)
[![NPM downloads](https://img.shields.io/npm/dm/indexed-db-async.svg?style=flat)](https://npmjs.com/package/indexed-db-async)

## install

```bash
npm install --save indexed-db-async
```
or
```bash
yarn add indexed-db-async
```

## usage

1. open db

```js
// a filter.js
import IndexedDBAsync from 'indexed-db-async';

const db = new IndexedDBAsync('indexed-db-test', 1, [
  {
    name: 'table1',
    key: 'url',
    // autoIncrement: true,
    indexes: [
      { name: 'timestamp', unique: false }
    ]
  }
]);

// add/update data
db.put('table1', { url: 'url1', timestamp: (new Date()).now()  });
```

2. add/update data 

```js
for (let i = 1; i < 10; i++) {
  const count = await db.put<DBItem[]>('table1', { url: `url${i}`, data: 'data' + i, timestamp: Date.now() });
  console.log('put count: ' +  count);
}
```

3. get data 

```js
const item = await db.get('table1', `url1`);
console.log(`get item`, item);

// get all data
const itemList = await db.all('table1');
console.log(`get itemList`, itemList);
```

4. query data

```js
// query data by key
const itemList = await db.query('table1', `url1`);
console.log(`query item list `, itemList);

// query keys
const keys = await db.queryKeys('table1', IDBKeyRange.lowerBound(0), { indexName: 'timestamp' });
console.log(`query keys `, keys);

// query data by index
const itemList = await db.query('table1', 12314234234, { indexName: 'timestamp' });
console.log(`query item list `, itemList);

// query data by index using IDBKeyRange
const itemList = await db.query('table1', IDBKeyRange.lowerBound(0), { indexName: 'timestamp' });
console.log(`query item list `, itemList);
```

4. query table count

```js
const count = await db.count('table1');
console.log(`table count`, count);
```

5. clear table

```js
await db.clear('table1');
console.log(`table cleared, current count:`, await db.count(table1));
```

6. delete table item

```js
const deleteCount = await db.delete('table1', 'url1');
console.log(`delete count:`, deleteCount);

// delete data by index
const deleteCount = await db.delete('table1', 12314234234, { indexName: 'timestamp' });
console.log(`delete count:`, deleteCount);

// delete data by index using IDBKeyRange
const deleteCount = await db.delete('table1', IDBKeyRange.lowerBound(0), { indexName: 'timestamp' });
console.log(`delete count:`, deleteCount);
```

## License

[MIT](./LICENSE)

