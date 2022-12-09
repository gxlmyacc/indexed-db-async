import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import { useEvent, useStateWithPromise } from 'react-closure-hooks';

import './index.scss?scoped';


function IndexedDB() {
  const [db, setDb] = useStateWithPromise<IDBDatabase|null>(null);
  const [datas, setDatas] = useState<any[]>([]);
  const [timestamp, setTimestamp] = useState(0);

  const dbOpen = useEvent(async () => {
    let request = indexedDB.open('demo-indexed-db', 1);
    request.onerror = function (event) {
      console.error(event);
    };
    request.onupgradeneeded = function (event) {
      let db = (event.target as any).result as IDBDatabase;
      setDb(db);

      let objectStore = db.createObjectStore('fetched', { keyPath: 'url' });
      objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      objectStore.transaction.oncomplete = function (event) {
        message.info('open success!');

        let transaction = db.transaction('fetched', 'readwrite');
        let fetchedStore = transaction.objectStore('fetched');
        for (let i = 1; i < 10; i++) {
          fetchedStore.add({ url: `url${i}`, data: 'data' + i, timestamp: Date.now() });
        }
        transaction.commit();

        dbAll();
      };
    };
  });

  const dbPut = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readwrite');
    let table = transaction.objectStore('fetched');

    let req = table.put({ url: 'url100', data: 'data100', timestamp: Date.now() });
    req.onsuccess = () => {
      message.info('fetched put success');
      dbAll();
    };
  });

  const dbGet = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');

    const req = await table.get('url1');
    req.onsuccess = ev => {
      let result = req.result;
      setDatas([result]);
      message.info('fetched complete ');
    };
  });

  const dbAll = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');

    let req = table.getAll();
    req.onsuccess = event => {
      let datas = (event as any).result;
      setDatas(datas);

      let item = datas[Math.trunc(datas.length / 2)];
      setTimestamp(item.timestamp);

      message.info('fetched complete ');
    };
  });

  const dbKeys = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');

    let req = table.getAllKeys();
    req.onsuccess = () => {
      setDatas(req.result);
      message.info('fetched complete ');
    };
  });

  const dbQuery = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');

    let req = table.getAll(IDBKeyRange.lowerBound('url1'));
    req.onsuccess = () => {
      setDatas(req.result);
      message.info('fetched complete ');
    };
  });

  const dbQueryKeys = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');

    let req = table.getAllKeys(IDBKeyRange.lowerBound('url1'));
    req.onsuccess = () => {
      setDatas(req.result);
      message.info('fetched complete ');
    };
  });

  const dbQueryIndexGt = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');
    let index = table.index('timestamp');

    let req = index.getAll(IDBKeyRange.lowerBound(timestamp));
    req.onsuccess = () => {
      setDatas(req.result);
      message.info('fetched complete ');
    };
  });

  const dbQueryIndexGte = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');
    let index = table.index('timestamp');

    let req = index.getAll(IDBKeyRange.lowerBound(timestamp, true));
    req.onsuccess = () => {
      setDatas(req.result);
      message.info('fetched complete ');
    };
  });


  const dbCount = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readonly');
    let table = transaction.objectStore('fetched');

    let req =  table.count();
    req.onsuccess = () => {
      let totalCount = req.result;
      message.info('fetched total count: ' + totalCount);
    };
  });

  const dbClear = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readwrite');
    let table = transaction.objectStore('fetched');

    let req =  table.clear();
    req.onsuccess = () => {
      message.info('clear success');
      dbAll();
    };
  });

  const dbDelete = useEvent(async () => {
    if (!db) return;
    const transaction = db.transaction('fetched', 'readwrite');
    let table = transaction.objectStore('fetched');

    let req =  table.delete('url1');
    req.onsuccess = () => {
      message.info('fetched delete complete. ');
      dbAll();
    };
  });


  const dbDestory = useEvent(() => {
    if (!db) return;
    db.deleteObjectStore('fetched');
    setDb(null);
    setDatas([]);
  });

  return (
    <div className="indexed-db">
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
export default IndexedDB;
