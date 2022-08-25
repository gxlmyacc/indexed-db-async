import React from 'react';
import ReactDOM from 'react-dom';
import App from '@/components/app/index';
import router from './router';

import '@/assets/styles/global.scss';
import 'antd/dist/antd.css';

router.beforeEach(async (to, from, next) => {
  if (to.query.ignoreRoute) return next(false);

  // eslint-disable-next-line no-console
  console.log(
    '%croute changed',
    'background-color:#ccc;color:green;font-weight:bold;font-size:14px;',
    to.url,
    to.query,
    to.meta,
    to.redirectedFrom,
  );

  return next();
});

ReactDOM.render(<App />, document.getElementById('root'));
