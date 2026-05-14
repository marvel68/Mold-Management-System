import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Input, Select, Table, Button, Modal, Form, message, Upload, Space, Tag, Descriptions, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UploadOutlined, ProfileOutlined, PhoneOutlined, BankOutlined, FileTextOutlined } from '@ant-design/icons'
import { supplierAPI, attachmentAPI } from '../utils/api'
import AttachmentPreview from '../components/AttachmentPreview'
import './Suppliers.css'

// 供应商类型选项
const SUPPLIER_TYPES = [
  { value: '模胚', label: '模胚' },
  { value: '热流道', label: '热流道' },
  { value: '钢材', label: '钢材' },
  { value: '铜材', label: '铜材' },
  { value: '配件', label: '配件' },
  { value: '外协加工', label: '外协加工' },
  { value: '其他', label: '其他' }
]

// 类型颜色
const TYPE_COLORS = {
  '模胚': 'cyan',
  '热流道': 'blue',
  '钢材': 'green',
  '铜材': 'purple',
  '配件': 'orange',
  '外协加工': 'red',
  '其他': 'default'
}

function Suppliers() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [form] = Form.useForm()
  const [attachments, setAttachments] = useState([])
  const [uploadLoading, setUploadLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [searchText, filterType])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchText) params.search = searchText
      if (filterType) params.type = filterType
      
      const res = await supplierAPI.list(params)
      setData(res.items || res)
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSupplier = async (record) => {
    setSelectedSupplier(record)
    loadAttachments(record.id)
  }

  const loadAttachments = async (supplierId) => {
    try {
      const res = await supplierAPI.attachments(supplierId)
      setAttachments(res || [])
    } catch (err) {
      setAttachments([])
    }
  }

  const handleAdd = () => {
    setEditingSupplier(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingSupplier(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      category: record.category,
      contact_person: record.contact_person,
      contact_phone: record.contact_phone,
      contact_email: record.contact_email,
      address: record.address,
      bank_name: record.bank_name,
      bank_account: record.bank_account,
      tax_rate: record.tax_rate,
      remark: record.remark
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await supplierAPI.delete(id)
      message.success('删除成功')
      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null)
        setAttachments([])
      }
      loadData()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingSupplier) {
        await supplierAPI.update(editingSupplier.id, values)
        message.success('更新成功')
      } else {
        await supplierAPI.create(values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadData()
    } catch (err) {
      if (!err.errorFields) {
        message.error('操作失败')
      }
    }
  }

  const handleUpload = async (file, supplierId) => {
    if (!supplierId) {
      message.warning('请先选择供应商')
      return false
    }
    
    try {
      setUploadLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('supplier_id', supplierId)
      
      await attachmentAPI.upload(formData)
      message.success('上传成功')
      loadAttachments(supplierId)
    } catch (err) {
      message.error('上传失败')
    } finally {
      setUploadLoading(false)
    }
    return false
  }

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await attachmentAPI.delete(attachmentId)
      message.success('删除成功')
      if (selectedSupplier) {
        loadAttachments(selectedSupplier.id)
      }
    } catch (err) {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '编码',
      dataIndex: 'code',
      width: 100,
      render: v => <Tag color="cyan">{v}</Tag>
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
      render: v => <span style={{ fontWeight: 500, color: '#fff' }}>{v}</span>
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: v => <Tag color={TYPE_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      width: 100
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 130
    },
    {
      title: '税率',
      dataIndex: 'tax_rate',
      width: 80,
      align: 'right',
      render: v => v ? `${v}%` : '-'
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button 
            type="text" 
            size="small" 
            icon={<ProfileOutlined />} 
            onClick={() => handleSelectSupplier(record)}
          />
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除此供应商吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 统计计算
  const stats = {
    total: data.length,
    模胚: data.filter(d => d.type === '模胚').length,
    热流道: data.filter(d => d.type === '热流道').length,
    钢材: data.filter(d => d.type === '钢材').length,
    配件: data.filter(d => d.type === '配件').length
  }

  return (
    <div className="page-container suppliers">
      <div className="page-header">
        <h1 className="page-title glow-text">🏭 供应商管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增供应商
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <div className="stat-card glass-card">
            <span className="stat-icon">📊</span>
            <div className="stat-info">
              <span className="stat-value font-orbitron">{stats.total}</span>
              <span className="stat-label">供应商总数</span>
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="stat-card glass-card stat-cyan">
            <span className="stat-icon">🧱</span>
            <div className="stat-info">
              <span className="stat-value font-orbitron">{stats.模胚}</span>
              <span className="stat-label">模胚类</span>
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="stat-card glass-card stat-blue">
            <span className="stat-icon">🔥</span>
            <div className="stat-info">
              <span className="stat-value font-orbitron">{stats.热流道}</span>
              <span className="stat-label">热流道类</span>
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="stat-card glass-card stat-green">
            <span className="stat-icon">🪵</span>
            <div className="stat-info">
              <span className="stat-value font-orbitron">{stats.钢材}</span>
              <span className="stat-label">钢材类</span>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card glass-card stat-orange">
            <span className="stat-icon">🔩</span>
            <div className="stat-info">
              <span className="stat-value font-orbitron">{stats.配件}</span>
              <span className="stat-label">配件类</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 左侧供应商列表 */}
        <Col span={selectedSupplier ? 12 : 24}>
          <Card className="list-card glass-card">
            <div className="list-filters">
              <Input
                placeholder="搜索供应商..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="按类型筛选"
                value={filterType}
                onChange={setFilterType}
                style={{ width: 120 }}
                allowClear
                options={SUPPLIER_TYPES}
              />
            </div>
            
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="id"
              rowClassName={(record) => record.id === selectedSupplier?.id ? 'selected-row' : ''}
              onRow={(record) => ({
                onClick: () => handleSelectSupplier(record),
                style: { cursor: 'pointer' }
              })}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: total => `共 ${total} 条`
              }}
            />
          </Card>
        </Col>

        {/* 右侧供应商详情 */}
        {selectedSupplier && (
          <Col span={12}>
            <Card 
              className="detail-card glass-card"
              title={
                <div className="detail-header">
                  <span className="detail-icon">🏢</span>
                  <span className="detail-name">{selectedSupplier.name}</span>
                  <Tag color={TYPE_COLORS[selectedSupplier.type]}>{selectedSupplier.type}</Tag>
                </div>
              }
              extra={
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(selectedSupplier)}>
                    编辑
                  </Button>
                  <Button type="text" onClick={() => setSelectedSupplier(null)}>
                    关闭
                  </Button>
                </Space>
              }
            >
              <Descriptions column={2} size="small" className="supplier-descriptions">
                <Descriptions.Item label="编码" span={1}>
                  <Tag color="cyan">{selectedSupplier.code}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="分类" span={1}>
                  {selectedSupplier.category || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="联系人" span={1}>
                  <Space><ProfileOutlined /> {selectedSupplier.contact_person || '-'}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="电话" span={1}>
                  <Space><PhoneOutlined /> {selectedSupplier.contact_phone || '-'}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="邮箱" span={2}>
                  {selectedSupplier.contact_email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>
                  {selectedSupplier.address || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="开户银行" span={2}>
                  <Space><BankOutlined /> {selectedSupplier.bank_name || '-'}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="银行账号" span={2}>
                  <Space><FileTextOutlined /> {selectedSupplier.bank_account || '-'}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="税率" span={1}>
                  {selectedSupplier.tax_rate ? `${selectedSupplier.tax_rate}%` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {selectedSupplier.remark || '-'}
                </Descriptions.Item>
              </Descriptions>

              {/* 附件区域 */}
              <div className="attachments-section">
                <div className="attachments-header">
                  <span className="attachments-title">📎 附件</span>
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => handleUpload(file, selectedSupplier.id)}
                    disabled={uploadLoading}
                  >
                    <Button icon={<UploadOutlined />} size="small" loading={uploadLoading}>
                      上传附件
                    </Button>
                  </Upload>
                </div>
                
                <div className="attachments-list">
                  {attachments.length === 0 ? (
                    <div className="empty-attachments">
                      暂无附件
                    </div>
                  ) : (
                    attachments.map(att => (
                      <AttachmentPreview
                        key={att.id}
                        file={att}
                        inline
                        showDelete
                        onDelete={handleDeleteAttachment}
                      />
                    ))
                  )}
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingSupplier ? '保存' : '创建'}
        cancelText="取消"
        width={700}
        className="supplier-modal"
      >
        <Form form={form} layout="vertical" className="supplier-form">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="如 SUP001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="供应商全称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="选择供应商类型" options={SUPPLIER_TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="细分分类" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="联系人">
                <Input placeholder="联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact_phone" label="电话">
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_email" label="邮箱">
                <Input placeholder="电子邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tax_rate" label="税率(%)">
                <Input type="number" placeholder="如 13" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="详细地址" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bank_name" label="开户银行">
                <Input placeholder="如 工商银行深圳分行" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bank_account" label="银行账号">
                <Input placeholder="对公账户" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="其他备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Suppliers
