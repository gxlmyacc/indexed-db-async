import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { RouterView, useRouteTitle } from 'react-view-router';
import { useEvent } from 'react-closure-hooks';
import router from '@/router';

import './index.scss?scoped';

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

function App() {
  let {
    titles,
    currentPaths
  } = useRouteTitle({ maxLevel: 1 }, router);

  let menuItems = useMemo(() => titles.map(titleItem => getItem(
    titleItem.title,
    titleItem.path
  )), [titles]);

  const doMenuClick = useEvent<Exclude<MenuProps['onClick'], undefined>>(info => {
    router.push(info.key);
  });

  return (
    <Layout className="page-layout" style={{ height: '100%' }}>
      <Header className="page-header">
        <div className="page-header-title">
          IndexedDB Demo
        </div>
      </Header>
      <Layout>
        <Sider className="page-sider">
          <Menu
            onClick={doMenuClick}
            style={{ width: 200 }}
            selectedKeys={currentPaths}
            mode="inline"
            theme="dark"
            items={menuItems}
          />
        </Sider>
        <Content className="page-content">
          <RouterView router={router} />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
