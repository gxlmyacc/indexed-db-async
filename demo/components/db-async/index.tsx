import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import { useEvent, useStateWithPromise } from 'react-closure-hooks';
import IndexedDBAsync from '../../..';

import './index.scss?scoped';


type DBItem = {
  url: string,
  data: string,
  timestamp: number,
}

function DBAsyncIndex() {
  const [db, setDb] = useStateWithPromise<IndexedDBAsync|null>(null);
  const [datas, setDatas] = useState<DBItem[]|string[]>([]);
  const [timestamp, setTimestamp] = useState(0);

  const dbOpen = useEvent(async () => {
    const db = new IndexedDBAsync('indexed-db-test', 1, [
      {
        name: 'fetched',
        key: 'url',
        indexes: [
          { name: 'timestamp', unique: false }
        ]
      }
    ]);
    await setDb(db);
    message.info('open success!');
    dbAll();
  });

  const dbPut = useEvent(async () => {
    if (!db) return;
    for (let i = 1; i < 10; i++) {
      const count = await db.put('fetched', { url: `url${i}`, data: 'data' + i, timestamp: Date.now() });
      console.log('put count: ' +  count);
    }
    message.info('fetched total count: ' + (await db.count('fetched')));
    dbAll();
  });

  const dbGet = useEvent(async () => {
    if (!db) return;
    let datas = [];
    for (let i = 1; i < 10; i++) {
      const item = await db.get<DBItem>('fetched', `url${i}`);
      datas.push(item);
      console.log(`get item [${i}] `, item);
    }
    setDatas(datas);
    message.info('fetched complete ');
  });

  const dbAll = useEvent(async () => {
    if (!db) return;
    const datas = await db.all<DBItem>('fetched');
    if (datas.length) {
      let item = datas[Math.trunc(datas.length / 2)];
      setTimestamp(item.timestamp);
    }
    setDatas(datas);
    message.info('fetched complete ');
  });

  const dbKeys = useEvent(async () => {
    if (!db) return;
    const keys = await db.keys<string>('fetched');
    setDatas(keys);
    message.info('fetched complete ');
  });

  const dbQuery = useEvent(async () => {
    if (!db) return;
    const datas = await db.query<DBItem>('fetched', '> "url1"');
    setDatas(datas);
    message.info('fetched complete ');
  });

  const dbQueryKeys = useEvent(async () => {
    if (!db) return;
    const keys = await db.queryKeys<string>('fetched', '> "url1"');
    setDatas(keys);
    message.info('fetched complete ');
  });

  const dbQueryIndexGt = useEvent(async () => {
    if (!db) return;
    const datas = await db.query<DBItem>('fetched', `timestamp > ${timestamp}`);
    setDatas(datas);
    message.info('fetched complete ');
  });

  const dbQueryIndexGte = useEvent(async () => {
    if (!db) return;
    const datas = await db.query<DBItem>('fetched', `timestamp >= ${timestamp}`);
    setDatas(datas);
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
    dbAll();
  });

  const dbDelete = useEvent(async () => {
    if (!db) return;
    for (let i = 1; i < 10; i++) {
      await db.delete('fetched', `url${i}`);
    }
    message.info('fetched delete complete. current count: ' + (await db.count('fetched')));
    dbAll();
  });

  const dbDeleteRange = useEvent(async () => {
    if (!db) return;
    await db.deleteRange('fetched', '> "url1"');
    message.info('fetched delete complete. current count: ' + (await db.count('fetched')));
    dbAll();
  });

  const dbDeleteRangeIndexGt = useEvent(async () => {
    if (!db) return;
    await db.deleteRange('fetched', `timestamp > ${timestamp}`);
    message.info('fetched delete complete. current count: ' + (await db.count('fetched')));
    dbAll();
  });

  const dbDeleteRangeIndexGte = useEvent(async () => {
    if (!db) return;
    await db.deleteRange('fetched', `timestamp >= ${timestamp}`);
    message.info('fetched delete complete. current count: ' + (await db.count('fetched')));
    dbAll();
  });

  const dbDestory = useEvent(() => {
    if (!db) return;
    db.destory();
    setDb(null);
    setDatas([]);
  });

  return (
    <div className="db-async">
      <Button onClick={dbOpen}>open db</Button>
      <Button onClick={() => setDatas([])}>clear</Button>
      {
        db
          ? (
            <div style={{ marginTop: 10 }}>
              <Button onClick={dbAll}>db.all</Button>
              <Button onClick={dbPut}>db.put</Button>
              <Button onClick={dbGet}>db.get</Button>
              <Button onClick={dbKeys}>db.keys</Button>
              <Button onClick={dbQuery}>db.query</Button>
              <Button onClick={dbQueryKeys}>db.query:keys</Button>
              <Button onClick={dbQueryIndexGt}>db.query:index:{'>'}</Button>
              <Button onClick={dbQueryIndexGte}>db.query:index:{'>='}</Button>
              <Button onClick={dbCount}>db.count</Button>
              <Button onClick={dbClear}>db.clear</Button>
              <Button onClick={dbDelete}>db.delete</Button>
              <Button onClick={dbDeleteRange}>db.deleteRange</Button>
              <Button onClick={dbDeleteRangeIndexGt}>db.deleteRange:index:{'>'}</Button>
              <Button onClick={dbDeleteRangeIndexGte}>db.deleteRange:index:{'>='}</Button>
              <Button onClick={dbDestory}>db.destory</Button>
            </div>
          )
          : null
      }
      <div>
        <hr />
        <div>datas</div>
        <hr />
        <div>timestamp start :&nbsp;
          <Input
            type="number"
            value={timestamp}
            onChange={e => setTimestamp(Number(e.target.value))}
            style={{ width: 200 }}
          />
        </div>
        <hr />
        {
          datas.map((v, i) => <div key={i}>
            {
              typeof v === 'string' ? v : JSON.stringify(v)
            }
          </div>)
        }
        {!datas.length ? 'datas is empty' : ''}
      </div>
    </div>
  );
}
export default DBAsyncIndex;
