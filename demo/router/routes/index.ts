import { normalizeRoutes, lazyImport } from 'react-view-router';

const routes = normalizeRoutes([
  { path: '/', index: 'db' },
  {
    path: 'db',
    component: lazyImport(() => import('@/components/db')),
    meta: {
      title: 'indexed-db'
    }
  },
  {
    path: 'db-async',
    component: lazyImport(() => import('@/components/db-async')),
    meta: {
      title: 'indexed-db-async'
    }
  },
  {
    path: 'local-forage',
    component: lazyImport(() => import('@/components/local-forage')),
    meta: {
      title: 'LocalForage'
    }
  },
]);

export default routes;
