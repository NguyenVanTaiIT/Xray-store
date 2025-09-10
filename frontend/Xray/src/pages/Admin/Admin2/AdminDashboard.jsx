import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { getDashboardStats } from '../../../services/adminService';
import { toast } from 'react-toastify';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import AdminPanel from '../../../components/AdminPanel';

// Sample data for charts
const salesData = [
  { name: 'Tháng 1', orders: 120, revenue: 50000000 },
  { name: 'Tháng 2', orders: 150, revenue: 65000000 },
  { name: 'Tháng 3', orders: 180, revenue: 78000000 },
  { name: 'Tháng 4', orders: 200, revenue: 85000000 },
  { name: 'Tháng 5', orders: 220, revenue: 92000000 },
  { name: 'Tháng 6', orders: 250, revenue: 105000000 },
];

const categoryData = [
  { name: 'Gaming', value: 45, color: '#8884d8' },
  { name: 'Office', value: 30, color: '#82ca9d' },
  { name: 'Ultrabook', value: 25, color: '#ffc658' },
];

export default function AdminDashboard() {
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingOrders: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/');
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardStats();
        setStats({
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          totalUsers: data.totalUsers || 0,
          pendingOrders: data.pendingOrders || 0
        });
      } catch (err) {
        const errorMessage = err.response?.status === 401
          ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
          : err.response?.status === 403
          ? 'Quyền truy cập bị từ chối.'
          : err.message || 'Không thể tải thống kê';
        toast.error(errorMessage);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <AdminPanel title="Admin Dashboard">
  <div className="loadingContainer">
    <div className="loadingSpinner"></div>
    <div className="loadingText">Đang tải thống kê...</div>
  </div>
</AdminPanel>

    );
  }

  return (
    <AdminPanel 
      title="Admin Dashboard" 
      subtitle="Bảng điều khiển quản trị hệ thống"
      showBackButton={true}
      backPath="/"
    >
      {/* Statistics Cards */}
      <Row gutter={16} className="statsRow">
        <Col span={6}>
          <Card className="darkCard">
            <Statistic
              title="Tổng số đơn hàng"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="darkCard">
            <Statistic
              title="Tổng doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₫"
              formatter={(value) => Number(value).toLocaleString('vi-VN')}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="darkCard">
            <Statistic
              title="Tổng số người dùng"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="darkCard">
            <Statistic
              title="Đơn hàng chờ xử lý"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={16}>
        <Col span={12}>
          <Card className="darkCard">
            <div className="chartTitle">Biểu đồ doanh thu theo tháng</div>
            <LineChart width={500} height={300} data={salesData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1E90FF', color: '#fff' }} 
                formatter={(value) => Number(value).toLocaleString('vi-VN') + '₫'} 
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="revenue" stroke="#1E90FF" strokeWidth={2} />
            </LineChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="darkCard">
            <div className="chartTitle">Số lượng đơn hàng theo tháng</div>
            <BarChart width={500} height={300} data={salesData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1E90FF', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Bar dataKey="orders" fill="#82ca9d" />
            </BarChart>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card className="darkCard">
            <div className="chartTitle">Phân bổ sản phẩm theo danh mục</div>
            <PieChart width={500} height={300}>
              <Pie
                data={categoryData}
                cx={250}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1E90FF', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#fff' }} />
            </PieChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="darkCard">
            <div className="chartTitle">Quản lý hệ thống</div>
            <Space direction="vertical" size="middle" className="managementButtons">
              <Button 
                type="primary" 
                size="large" 
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/admin/orders')}
                block
              >
                Quản lý đơn hàng
              </Button>
              <Button 
                type="primary" 
                size="large" 
                icon={<PieChartOutlined />}
                onClick={() => navigate('/admin/products')}
                block
              >
                Quản lý sản phẩm
              </Button>
              <Button 
                type="primary" 
                size="large" 
                icon={<UserOutlined />}
                onClick={() => navigate('/admin/users')}
                block
              >
                Quản lý người dùng
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </AdminPanel>
  );
}
