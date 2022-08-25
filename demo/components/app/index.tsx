import React from 'react';
import { Layout } from 'antd';
import { RouterView } from 'react-view-router';
import router from '@/router';

import './index.scss?scoped';

const { Header, Content } = Layout;

function App() {
  return (
    <Layout className="page-layout" style={{ height: '100%' }}>
      <Header className="page-header">Header</Header>
      <Layout>
        {/* <Sider className="page-sider" /> */}
        <Content className="page-content">
          <RouterView router={router} />
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
