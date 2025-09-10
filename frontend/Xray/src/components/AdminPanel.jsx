import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import {
  BarChartOutlined,
  ShoppingCartOutlined,
  PieChartOutlined,
  UserOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

const { Header, Content, Footer, Sider } = Layout;

const AdminPanel = ({ children, title, showBackButton = true, backPath = '/admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định menu item active dựa trên path hiện tại
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/orders')) return '2';
    if (path.includes('/admin/products')) return '3';
    if (path.includes('/admin/users')) return '4';
    return '1'; // Dashboard
  };

  const menuItems = [
    {
      key: '1',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/admin')
    },
    {
      key: '2',
      icon: <ShoppingCartOutlined />,
      label: 'Đơn hàng',
      onClick: () => navigate('/admin/orders')
    },
    {
      key: '3',
      icon: <PieChartOutlined />,
      label: 'Sản phẩm',
      onClick: () => navigate('/admin/products')
    },
    {
      key: '4',
      icon: <UserOutlined />,
      label: 'Người dùng',
      onClick: () => navigate('/admin/users')
    }
  ];

  return (
    <Layout className="layoutTransition">
      {/* Sidebar cố định */}
      <Sider
        width={200}
        className="sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <div className="sidebarHeader">
          <h3 className="sidebarTitle">Admin Panel</h3>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>

      {/* Layout chính, chừa khoảng trống sidebar */}
      <Layout style={{ marginLeft: 200, minHeight: '100vh' }}>
        <Header className="header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <div className="headerContent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="headerTitle" style={{ margin: 0 }}>{title}</h1>
            {showBackButton && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(backPath)}
                className="backButton"
              >
                {backPath === '/admin' ? 'Dashboard' : 'Quay lại'}
              </Button>
            )}
          </div>
        </Header>


        <Content className="content" style={{ padding: '16px', overflow: 'auto' }}>
          <div className="contentInner">
            {children}
          </div>
        </Content>

        <Footer className="footer">
          Admin Dashboard ©2024 - Powered by React & Ant Design
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminPanel;
