import { normalizeRoutes, lazyImport } from 'react-view-router';

const routes = normalizeRoutes([
  { path: '/', index: 'db-async' },
  {
    path: '/db',
    component: lazyImport(() => import('@/components/db'))
  },
  {
    path: 'db-async',
    component: lazyImport(() => import('@/components/db-async'))
  }
]);

export default routes;
