import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../../services/productService';
import { uploadProductImage } from '../../../services/productService';
import { UserContext } from '../../../contexts/UserContext';
import { toast } from 'react-toastify';
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
  Image, 
  Popconfirm,
  Row,
  Col,
  Statistic,
  Divider,
  Upload,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ShoppingOutlined,
  UploadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import AdminPanel from '../../../components/AdminPanel';
import placeholderImage from '../../../assets/Placeholder.jpg';

const { Option } = Select;
const { TextArea } = Input;

export default function ProductManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = React.useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await fetchProducts();
        setProducts(data.products);
      } catch (err) {
        toast.error(err.message || 'Không thể tải sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [isAuthenticated, user, navigate]);

  const handleImageUpload = async (file) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      message.error('Chỉ hỗ trợ định dạng JPG hoặc PNG');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('File quá lớn (tối đa 5MB)');
      return false;
    }

    setImageUploading(true);
    try {
      const imageUrl = await uploadProductImage(file);
      form.setFieldsValue({ image: imageUrl });
      message.success('Tải ảnh lên thành công');
      return false; // Prevent default upload
    } catch (err) {
      message.error(err.message || 'Không thể tải ảnh lên');
      return false;
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddProduct = async (values) => {
    try {
      const product = await createProduct(values);
      setProducts([...products, product]);
      toast.success('Thêm sản phẩm thành công');
      handleModalCancel();
    } catch (err) {
      toast.error(err.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleEditProduct = async (values) => {
    try {
      const response = await updateProduct(editingProduct._id, {
        ...values,
        stockQuantity: parseInt(values.stockQuantity) || 0,
      });
      setProducts(products.map(p => p._id === editingProduct._id ? response : p));
      toast.success('Cập nhật sản phẩm thành công');
      handleModalCancel();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật sản phẩm');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Xóa sản phẩm thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      specs: Array.isArray(product.specs) ? product.specs.join(', ') : product.specs
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        await handleEditProduct(values);
      } else {
        await handleAddProduct(values);
      }
    } catch (err) {
      console.error('Form validation failed:', err);
    }
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Image
            width={50}
            height={50}
            src={record.image}
            alt={text}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback={placeholderImage}
            onError={(e) => {
              e.target.src = placeholderImage;
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.sku}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <span style={{ fontWeight: 'bold', color: '#cf1322' }}>
          {Number(price).toLocaleString('vi-VN')}₫
        </span>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand) => <Tag color="green">{brand}</Tag>,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      render: (quantity) => (
        <Tag color={quantity > 10 ? 'green' : quantity > 0 ? 'orange' : 'red'}>
          {quantity}
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
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditClick(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa sản phẩm này?"
            onConfirm={() => handleDeleteProduct(record._id)}
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
      <AdminPanel title="Quản lý sản phẩm" subtitle="Đang tải danh sách sản phẩm...">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Đang tải danh sách sản phẩm...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Quản lý sản phẩm" 
      subtitle="Thêm, sửa, xóa và quản lý danh sách sản phẩm"
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={products.length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Còn hàng"
              value={products.filter(p => p.stockQuantity > 0).length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sắp hết hàng"
              value={products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hết hàng"
              value={products.filter(p => p.stockQuantity === 0).length}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Products Table */}
      <Card 
        title="Danh sách sản phẩm" 
        extra={
          <Button 
            icon={<PlusOutlined />} 
            type="primary"
            onClick={() => {
              setEditingProduct(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Thêm sản phẩm
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={products} 
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
        />
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
        cancelText="Hủy"
        confirmLoading={imageUploading}
      >
        <Form
          form={form}
          layout="vertical"
          name="productForm"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá (VNĐ)"
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá sản phẩm!' }]}
              >
                <Input type="number" placeholder="Nhập giá sản phẩm" min="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Ảnh sản phẩm"
            name="image"
            rules={[{ required: true, message: 'Vui lòng tải ảnh sản phẩm!' }]}
          >
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/jpeg,image/png"
            >
              <Button icon={<UploadOutlined />} loading={imageUploading}>
                {imageUploading ? 'Đang tải...' : 'Tải ảnh lên'}
              </Button>
            </Upload>
            {form.getFieldValue('image') && (
              <div style={{ marginTop: 8 }}>
                <Image
                  width={100}
                  height={100}
                  src={form.getFieldValue('image')}
                  alt="Preview"
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  fallback={placeholderImage}
                  onError={(e) => {
                    e.target.src = placeholderImage;
                  }}
                />
              </div>
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
              >
                <Select placeholder="Chọn danh mục">
                  <Option value="gaming">Gaming</Option>
                  <Option value="office">Office</Option>
                  <Option value="ultrabook">Ultrabook</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Thương hiệu"
                name="brand"
                rules={[{ required: true, message: 'Vui lòng chọn thương hiệu!' }]}
              >
                <Select placeholder="Chọn thương hiệu">
                  <Option value="asus">Asus</Option>
                  <Option value="msi">MSI</Option>
                  <Option value="acer">Acer</Option>
                  <Option value="lenovo">Lenovo</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true, message: 'Vui lòng nhập SKU!' }]}
              >
                <Input placeholder="BRAND-CATEGORY-XXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số lượng tồn kho"
                name="stockQuantity"
                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
              >
                <Input type="number" placeholder="Nhập số lượng" min="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bảo hành"
                name="warranty"
              >
                <Input placeholder="VD: 24 tháng" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Bộ nhớ"
                name="storage"
              >
                <Input placeholder="VD: 512GB SSD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Màn hình"
                name="display"
                rules={[{ required: true, message: 'Vui lòng nhập thông tin màn hình!' }]}
              >
                <Input placeholder="VD: 15.6 inch FHD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Hệ điều hành"
                name="os"
              >
                <Input placeholder="VD: Windows 11" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Pin"
                name="battery"
              >
                <Input placeholder="VD: 3-cell, 45Wh" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Trọng lượng"
            name="weight"
          >
            <Input placeholder="VD: 1.8kg" />
          </Form.Item>

          <Form.Item
            label="Thông số kỹ thuật"
            name="specs"
            rules={[{ required: true, message: 'Vui lòng nhập thông số kỹ thuật!' }]}
          >
            <Input placeholder="Thông số kỹ thuật (phân cách bằng dấu phẩy)" />
          </Form.Item>

          <Form.Item
            label="Mô tả tính năng"
            name="featuresDescription"
          >
            <TextArea rows={3} placeholder="Mô tả các tính năng nổi bật của sản phẩm" />
          </Form.Item>

          <Form.Item
            label="Mô tả sản phẩm"
            name="description"
          >
            <TextArea rows={4} placeholder="Mô tả chi tiết về sản phẩm" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPanel>
  );
}