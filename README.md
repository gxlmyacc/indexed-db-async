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

const count = await db.add(
  'table1', 
  [
    { url: `url1`, data: 'data1', timestamp: Date.now() },
    { url: `url2`, data: 'data2', timestamp: Date.now() },
    { url: `url3`, data: 'data3', timestamp: Date.now() }
  ]
);

const count = await db.put(
  'table1', 
  [
    { url: `url1`, data: 'data1', timestamp: Date.now() },
    { url: `url2`, data: 'data2', timestamp: Date.now() },
    { url: `url3`, data: 'data3', timestamp: Date.now() }
  ]
);
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
const keys = await db.queryKeys('table1', '> "url1"');
console.log(`query keys `, keys);

// query data by index
const itemList = await db.query('table1', 'timestamp > 12314234234');
console.log(`query item list `, itemList);

// query data by index using IDBKeyRange
const itemList = await db.query('table1', IDBKeyRange.lowerBound(0));
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
await db.delete('table1', 'url1');

// delete datas
await db.delete('table1', ['url1', 'url2', 'url3']);

// delete data using IDBKeyRange
await db.deleteRange('table1', '> "url1"');

// delete data by index
await db.deleteRange('table1', 'timestamp = 12314234234');

// delete data by index using IDBKeyRange
await db.deleteRange('table1', 'timestamp > 0');

await db.deleteRange('table1', `timestamp >= 0 && < ${new Date().now()}`);

```

7. create IDBKeyRange by text
```js
db.range('<= x')          // => IDBKeyRange.upperBound('x')
db.range('< x')           // => IDBKeyRange.upperBound('x', true)
db.range('>= x')          // => IDBKeyRange.lowerBound('x')
db.range('> x')           // => IDBKeyRange.lowerBound('x', true)
db.range('>= x && <= y')  // => IDBKeyRange.bound('x', 'y')
db.range('> x && < y')    // => IDBKeyRange.bound('x', 'y', true, true)
db.range('> x && <= y')   // => IDBKeyRange.bound('x', 'y', true)
db.range('>= x && < y')   // => IDBKeyRange.bound('x', 'y', false, true)
db.range('= x')           // => IDBKeyRange.only('x')
```

## License

[MIT](./LICENSE)

