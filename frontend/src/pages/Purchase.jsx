import React, { useEffect, useState } from 'react'
import { 
  Table, Card, Button, Input, Select, DatePicker, Upload, 
  Space, Tag, Modal, Form, message, Row, Col, Statistic
} from 'antd'
import { 
  SearchOutlined, UploadOutlined, ReloadOutlined, 
  PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined
} from '@ant-design/icons'
import { purchaseAPI, uploadAPI } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/format'
import dayjs from 'dayjs'
import './Purchase.css'

const { RangePicker } = DatePicker

function Purchase() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
    loadStats()
  }, [])

  const loadData = async (params = {}) => {
    try {
      setLoading(true)
      const queryParams = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
        ...params
      }
      
      const res = await purchaseAPI.list(queryParams)
      setData(res)
      setPagination(p => ({ ...p, total: res.length > 0 ? 9999 : 0 }))
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await purchaseAPI.stats()
      setStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const handleSearch = (values) => {
    const [startDate, endDate] = values.dateRange || []
    setFilters({
      supplier: values.supplier,
      mold_no: values.mold_no,
      subdivision: values.subdivision,
      project: values.project,
      start_date: startDate?.format('YYYY-MM-DD'),
      end_date: endDate?.format('YYYY-MM-DD')
    })
    setPagination(p => ({ ...p, current: 1 }))
    loadData({ skip: 0 })
  }

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setUploading(true)
      const res = await uploadAPI.purchase(formData)
      if (res.success) {
        message.success(`成功导入 ${res.imported} 条记录`)
        loadData()
        loadStats()
      } else {
        message.warning(`导入完成，但有 ${res.total_errors} 个错误`)
      }
    } catch (err) {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      delivery_date: dayjs(record.delivery_date)
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await purchaseAPI.delete(id)
      message.success('删除成功')
      loadData()
      loadStats()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        delivery_date: values.delivery_date.format('YYYY-MM-DD')
      }
      
      if (editingRecord) {
        await purchaseAPI.update(editingRecord.id, data)
        message.success('更新成功')
      } else {
        await purchaseAPI.create(data)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      form.resetFields()
      loadData()
      loadStats()
    } catch (err) {
      message.error('保存失败')
    }
  }

  const columns = [
    { title: '日期', dataIndex: 'delivery_date', width: 100, render: formatDate },
    { title: '送货单号', dataIndex: 'delivery_no', width: 120 },
    { title: '供应商', dataIndex: 'supplier', width: 100, 
      render: v => <Tag color="blue">{v}</Tag> },
    { title: '分类', dataIndex: 'category', width: 80 },
    { title: '细分', dataIndex: 'subdivision', width: 80 },
    { title: '项目', dataIndex: 'project', width: 70,
      render: v => {
        const colors = { '新模': 'cyan', '消耗': 'orange', '重工': 'red', '量产': 'green' }
        return <Tag color={colors[v] || 'default'}>{v}</Tag>
      }
    },
    { title: '模具编号', dataIndex: 'mold_no', width: 120 },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '数量', dataIndex: 'quantity', width: 70, align: 'right' },
    { title: '单价', dataIndex: 'unit_price_tax', width: 90, align: 'right', 
      render: v => v ? formatCurrency(v) : '-' },
    { title: '金额(含税)', dataIndex: 'amount_tax', width: 110, align: 'right',
      render: v => <span className="font-orbitron" style={{ color: '#00f2fe' }}>{formatCurrency(v)}</span> },
    { 
      title: '操作', 
      width: 120, 
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💰 采购管理</h1>
        <div className="header-actions">
          <Upload 
            accept=".xlsx" 
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              导入Excel
            </Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalVisible(true); }}>
            新增记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} className="stats-row">
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="总采购额(含税)" value={stats.total_tax} precision={2} prefix="¥" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="总采购额(不含税)" value={stats.total_no_tax} precision={2} prefix="¥" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="记录总数" value={stats.count} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="供应商数" value={stats.by_supplier?.length || 0} />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选 */}
      <Card size="small" className="filter-card glass-card">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="supplier" label="供应商">
            <Input placeholder="供应商名称" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="mold_no" label="模具编号">
            <Input placeholder="模具编号" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="project" label="项目">
            <Select allowClear style={{ width: 120 }} placeholder="选择项目">
              <Select.Option value="新模">新模</Select.Option>
              <Select.Option value="消耗">消耗</Select.Option>
              <Select.Option value="重工">重工</Select.Option>
              <Select.Option value="量产">量产</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); loadData(); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 数据表格 */}
      <Card className="table-card glass-card">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`
          }}
          onChange={(p) => {
            setPagination(p)
            loadData({ skip: (p.current - 1) * p.pageSize })
          }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={editingRecord ? "编辑采购记录" : "新增采购记录"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        className="edit-modal"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="delivery_date" label="送货日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_no" label="送货单号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier" label="供应商" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subdivision" label="细分">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="project" label="项目">
                <Select>
                  <Select.Option value="新模">新模</Select.Option>
                  <Select.Option value="消耗">消耗</Select.Option>
                  <Select.Option value="重工">重工</Select.Option>
                  <Select.Option value="量产">量产</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mold_no" label="模具编号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="process_type" label="加工类别">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="content" label="内容">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="quantity" label="数量">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_rate" label="税点">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit_price_tax" label="单价(含税)">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="amount_tax" label="金额(含税)">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="week" label="周">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Purchase
