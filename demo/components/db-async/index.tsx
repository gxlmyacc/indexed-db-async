import React, { useState } from 'react';
import { Button, message } from 'antd';
import { useEvent } from 'react-closure-hooks';
import IndexedDBAsync from '../../..';

import './index.scss?scoped';


type DBItem = {
  url: string,
  data: string,
  timestamp: number,
}

function DBAsyncIndex() {
  const [db, setDb] = useState<IndexedDBAsync|null>(null);

  const dbOpen = useEvent(() => {
    const db = new IndexedDBAsync('indexed-db-test', 1, [
      {
        name: 'fetched',
        key: 'url',
        indexes: [
          { name: 'timestamp', unique: false }
        ]
      }
    ]);
    setDb(db);
  });

  const dbPut = useEvent(async () => {
    if (!db) return;
    for (let i = 1; i < 10; i++) {
      const count = await db.put<DBItem[]>('fetched', { url: `url${i}`, data: 'data' + i, timestamp: Date.now() });
      console.log('put count: ' +  count);
    }
    message.info('fetched total count: ' + (await db.count('fetched')));
  });

  const dbGet = useEvent(async () => {
    if (!db) return;
    for (let i = 1; i < 10; i++) {
      const item = await db.get<DBItem>('fetched', `url${i}`);
      console.log(`get item [${i}] `, item);
    }
    message.info('fetched complete ');
  });

  const dbAll = useEvent(async () => {
    if (!db) return;
    const itemList = await db.all<DBItem>('fetched');
    console.log('all datas:', itemList);
    message.info('fetched complete ');
  });

  const dbKeys = useEvent(async () => {
    if (!db) return;
    const keys = await db.keys<string>('fetched');
    console.log('all keys:', keys);
    message.info('fetched complete ');
  });

  const dbQuery = useEvent(async () => {
    if (!db) return;
    const iterator = await db.query<DBItem>('fetched', IDBKeyRange.lowerBound(0));
    for (let item of iterator) {
      console.log('item', item);
    }
    message.info('fetched complete ');
  });

  const dbQueryKeys = useEvent(async () => {
    if (!db) return;
    const urls = await db.queryKeys<string>('fetched', IDBKeyRange.lowerBound(0));
    console.log('urls', urls);
    message.info('fetched complete ');
  });

  const dbCount = useEvent(async () => {
    if (!db) return;
    const totalCount = await db.count('fetched');
    message.info('fetched total count: ' + totalCount);
  });

  const dbClear = useEvent(async () => {
    if (!db) return;
    await db.clear('fetched');
    message.info('clear success, current count:' + (await db.count('fetched')));
  });

  const dbDelete = useEvent(async () => {
    if (!db) return;
    for (let i = 1; i < 10; i++) {
      const count = await db.delete('fetched', `url${i}`);
      console.log('delete count: ' +  count);
    }
    message.info('fetched delete complete. current count: ' + (await db.count('fetched')));
  });

  return (
    <div>
      <Button onClick={dbOpen}>open db</Button>
      {
        db
          ? (
            <>
              <Button onClick={dbPut}>db.put</Button>
              <Button onClick={dbGet}>db.get</Button>
              <Button onClick={dbAll}>db.all</Button>
              <Button onClick={dbKeys}>db.keys</Button>
              <Button onClick={dbQuery}>db.query</Button>
              <Button onClick={dbQueryKeys}>db.queryKeys</Button>
              <Button onClick={dbCount}>db.count</Button>
              <Button onClick={dbClear}>db.clear</Button>
              <Button onClick={dbDelete}>db.delete</Button>
            </>
          )
          : null
      }
    </div>
  );
}
export default DBAsyncIndex;
