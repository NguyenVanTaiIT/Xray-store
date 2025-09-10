import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { updateUserByAdmin, fetchUsers, deleteUser } from '../../../services/userService';
import { toast } from 'react-toastify';
import LocationSelector from '../../../components/LocationSelector';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Avatar, 
  Popconfirm,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  TeamOutlined
} from '@ant-design/icons';
import AdminPanel from '../../../components/AdminPanel';

const { Option } = Select;

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = React.useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(data.users);
      } catch (err) {
        toast.error(err.message || 'Không thể tải danh sách người dùng');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditingUser(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setEditingUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        name: editingUser.name,
        phone: editingUser.phone,
        address: {
          street: editingUser.address?.street || '',
          city: editingUser.address?.city || '',
          district: editingUser.address?.district || '',
          ward: editingUser.address?.ward || '',
          zipCode: editingUser.address?.zipCode || ''
        },
        role: editingUser.role,
        _id: editingUser._id
      };
      console.log('UserManagement - Sending update data:', JSON.stringify(updatedData));
      const response = await updateUserByAdmin(editingUser._id, updatedData);
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...response.user } : u));
      setEditingUser(null);
      toast.success('Cập nhật người dùng thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      if (id === user._id) {
        toast.error('Không thể xóa tài khoản của chính bạn');
        return;
      }
      await deleteUser(id);
      setUsers(users.filter(u => u._id !== id));
      toast.success('Xóa người dùng thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể xóa người dùng');
    }
  };

  const handleEditClick = (userData) => {
    setEditingUser({
      ...userData,
      address: {
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        district: userData.address?.district || '',
        ward: userData.address?.ward || '',
        zipCode: userData.address?.zipCode || ''
      }
    });
    form.setFieldsValue({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      'address.street': userData.address?.street || '',
      'address.city': userData.address?.city || '',
      'address.district': userData.address?.district || '',
      'address.ward': userData.address?.ward || '',
      'address.zipCode': userData.address?.zipCode || ''
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const updatedData = {
        name: values.name,
        phone: values.phone,
        address: {
          street: values['address.street'] || '',
          city: values['address.city'] || '',
          district: values['address.district'] || '',
          ward: values['address.ward'] || '',
          zipCode: values['address.zipCode'] || ''
        },
        role: values.role,
        _id: editingUser._id
      };
      
      const response = await updateUserByAdmin(editingUser._id, updatedData);
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...response.user } : u));
      toast.success('Cập nhật người dùng thành công');
      handleModalCancel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>@{record.email?.split('@')[0]}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'Chưa cập nhật',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: () => <Tag color="green">Hoạt động</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditClick(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDeleteUser(record._id)}
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
      <AdminPanel title="Quản lý người dùng" subtitle="Đang tải danh sách người dùng...">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Đang tải danh sách người dùng...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Quản lý người dùng" 
      subtitle="Quản lý thông tin và quyền hạn của người dùng trong hệ thống"
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số người dùng"
              value={users.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Quản trị viên"
              value={users.filter(u => u.role === 'admin').length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Người dùng thường"
              value={users.filter(u => u.role === 'user').length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Users Table */}
      <Card title="Danh sách người dùng" extra={<Button icon={<PlusOutlined />} type="primary">Thêm người dùng</Button>}>
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
        />
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          name="editUserForm"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên người dùng"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
              >
                <Input placeholder="Tên người dùng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
              >
                <Input placeholder="Email" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
              >
                <Input placeholder="Số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vai trò"
                name="role"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="user">Người dùng</Option>
                  <Option value="admin">Quản trị viên</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Địa chỉ"
            name="address.street"
          >
            <Input placeholder="Đường/Số nhà" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tỉnh/Thành phố"
                name="address.city"
              >
                <Input placeholder="Tỉnh/Thành phố" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Quận/Huyện"
                name="address.district"
              >
                <Input placeholder="Quận/Huyện" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phường/Xã"
                name="address.ward"
              >
                <Input placeholder="Phường/Xã" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mã bưu điện"
            name="address.zipCode"
          >
            <Input placeholder="Mã bưu điện" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPanel>
  );
}