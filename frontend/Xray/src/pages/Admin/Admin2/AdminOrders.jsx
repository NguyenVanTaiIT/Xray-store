import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { getOrders, updateOrderStatus, deleteOrder } from '../../../services/orderService';
import { toast } from 'react-toastify';
import { 
  Card, 
  Table, 
  Button, 
  Select, 
  Space, 
  Tag, 
  Popconfirm,
  Row,
  Col,
  Statistic,
  Divider,
  Avatar
} from 'antd';
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import AdminPanel from '../../../components/AdminPanel';

const { Option } = Select;

export default function AdminOrders() {
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  const fetchOrders = async () => {
    if (user.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền truy cập trang này');
      navigate('/profile');
      return;
    }
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err.response?.data || err.message);
      const errorMessage = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
        : err.message || 'Không thể tải danh sách đơn hàng';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };
  fetchOrders();
}, [user, isAuthenticated, navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success('Cập nhật trạng thái đơn hàng thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    try {
      await deleteOrder(orderId);
      setOrders(orders.filter(order => order._id !== orderId));
      toast.success('Xóa đơn hàng thành công');
    } catch (err) {
      console.error('Error deleting order:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Không thể xóa đơn hàng');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'processing': return 'blue';
      case 'shipped': return 'purple';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockCircleOutlined />;
      case 'processing': return <ClockCircleOutlined />;
      case 'shipped': return <ClockCircleOutlined />;
      case 'delivered': return <CheckCircleOutlined />;
      case 'cancelled': return <CloseCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: 'ID đơn hàng',
      dataIndex: '_id',
      key: '_id',
      render: (id) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          #{id.slice(-8)}
        </span>
      ),
    },
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <Avatar icon={<ShoppingCartOutlined />} />
          <span>{name || 'Không có tên'}</span>
        </Space>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Tổng giá',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => (
        <span style={{ fontWeight: 'bold', color: '#cf1322' }}>
          {Number(price).toLocaleString('vi-VN')}₫
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => navigate(`/orders/${record._id}`)}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa đơn hàng này?"
            onConfirm={() => handleDeleteOrder(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <AdminPanel title="Quản lý đơn hàng" subtitle="Đang tải danh sách đơn hàng...">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Đang tải danh sách đơn hàng...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Quản lý đơn hàng" 
      subtitle="Xem và cập nhật trạng thái đơn hàng"
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={orders.length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={orders.filter(o => o.status === 'pending').length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã giao"
              value={orders.filter(o => o.status === 'delivered').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hủy"
              value={orders.filter(o => o.status === 'cancelled').length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Orders Table */}
      <Card title="Danh sách đơn hàng">
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0 }}>
                <p><strong>Trạng thái hiện tại:</strong> {getStatusText(record.status)}</p>
                <p><strong>Cập nhật trạng thái:</strong></p>
                <Select
                  value={record.status}
                  style={{ width: 200 }}
                  onChange={(value) => handleStatusChange(record._id, value)}
                >
                  <Option value="pending">Chờ xử lý</Option>
                  <Option value="processing">Đang xử lý</Option>
                  <Option value="shipped">Đang giao</Option>
                  <Option value="delivered">Đã giao</Option>
                  <Option value="cancelled">Đã hủy</Option>
                </Select>
              </div>
            ),
            rowExpandable: (record) => true,
          }}
        />
      </Card>
    </AdminPanel>
  );
}