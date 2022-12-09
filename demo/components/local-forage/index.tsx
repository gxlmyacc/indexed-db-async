import React, { useState } from 'react';
import { Button, message } from 'antd';
import { useEvent } from 'react-closure-hooks';
import localforage from 'localforage';

import './index.scss?scoped';


function LocalForage() {
  const [db, setDb] = useState(localforage);
  const [datas, setDatas] = useState<any[]>([]);

  const setItem = useEvent(async () => {
    await db.setItem('url1', { url: 'url1', data: 'data100', timestamp: Date.now() });
    getItem('url1');
  });

  const getItem = useEvent(key => {
    let item = db.getItem(key);
    setDatas([item]);
  });

  const config = useEvent(() => {
    let result = localforage.config({
      driver: localforage.WEBSQL, // Force WebSQL; same as using setDriver()
      name: 'demo-localforage',
      version: 1.0,
      size: 4980736, // Size of database, in bytes. WebSQL-only for now.
      storeName: 'fetched',
      description: 'some description'
    });
    if (result) message.success('config success');
  });

  const multipleInstance = useEvent(key => {
    let store = localforage.createInstance({
      name: 'nameHere'
    });
    setDb(store);
    // Setting the key on one of these doesn't affect the other.
    store.setItem('key', 'value');
  });
  return (
    <div className="local-forage">
      <div style={{ marginTop: 10 }}>
        <Button onClick={setItem}>localforage.setItem</Button>
        <Button onClick={() => getItem('url1')}>localforage.getItem</Button>
        <Button onClick={() => config}>localforage.config</Button>
        <Button onClick={() => multipleInstance}>Multiple instance</Button>
      </div>
      <div>
        <hr />
        <div>datas</div>
        <hr />
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
export default LocalForage;
