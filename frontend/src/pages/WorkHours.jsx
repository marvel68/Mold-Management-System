import React, { useEffect, useState } from 'react'
import { 
  Table, Card, Button, Input, Select, DatePicker, Upload, 
  Space, Tag, Modal, Form, message, Row, Col, Statistic
} from 'antd'
import { 
  SearchOutlined, UploadOutlined, ReloadOutlined, 
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons'
import { workHourAPI, uploadAPI } from '../utils/api'
import { formatNumber, formatDate, formatEfficiency } from '../utils/format'
import dayjs from 'dayjs'
import './WorkHours.css'

const { RangePicker } = DatePicker

function WorkHours() {
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
      
      const res = await workHourAPI.list(queryParams)
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
      const res = await workHourAPI.stats()
      setStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const handleSearch = (values) => {
    const [startDate, endDate] = values.dateRange || []
    setFilters({
      operator: values.operator,
      mold_no: values.mold_no,
      work_type: values.work_type,
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
      const res = await uploadAPI.workHours(formData)
      if (res.success) {
        message.success(`成功导入 ${res.imported} 条记录`)
        loadData()
        loadStats()
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
      date: dayjs(record.date)
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await workHourAPI.delete(id)
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
      const submitData = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      }
      
      if (editingRecord) {
        await workHourAPI.update(editingRecord.id, submitData)
        message.success('更新成功')
      } else {
        await workHourAPI.create(submitData)
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

  const getEfficiencyColor = (eff) => {
    if (eff >= 100) return '#00ff88'
    if (eff >= 80) return '#4facfe'
    return '#f5576c'
  }

  const columns = [
    { title: '日期', dataIndex: 'date', width: 100, render: formatDate },
    { title: '模具编号', dataIndex: 'mold_no', width: 120 },
    { title: '工作事项', dataIndex: 'work_item', width: 150, ellipsis: true },
    { title: '操作者', dataIndex: 'operator', width: 90,
      render: v => <Tag color="purple">{v}</Tag> },
    { title: '工种', dataIndex: 'work_type', width: 80 },
    { title: '加工类别', dataIndex: 'process_category', width: 100 },
    { title: '件数', dataIndex: 'process_qty', width: 60, align: 'center' },
    { title: '预计工时', dataIndex: 'estimated_hours', width: 80, align: 'right',
      render: v => v ? `${v}H` : '-' },
    { title: '实际工时', dataIndex: 'actual_hours', width: 80, align: 'right',
      render: v => v ? `${v}H` : '-' },
    { title: '效率', dataIndex: 'efficiency', width: 80, align: 'right',
      render: v => v ? (
        <span style={{ color: getEfficiencyColor(v), fontFamily: 'Orbitron' }}>
          {formatEfficiency(v)}
        </span>
      ) : '-' },
    { title: '含税金额', dataIndex: 'amount_tax', width: 100, align: 'right',
      render: v => v ? `¥${formatNumber(v)}` : '-' },
    { 
      title: '操作', 
      width: 100,
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
        <h1 className="page-title">⏱️ 工时管理</h1>
        <div className="header-actions">
          <Upload accept=".xlsx" showUploadList={false} beforeUpload={handleUpload}>
            <Button icon={<UploadOutlined />} loading={uploading}>导入Excel</Button>
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
              <Statistic title="总工时" value={stats.total_hours} suffix="H" precision={1} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="平均效率" value={stats.avg_efficiency} suffix="%" precision={1} 
                valueStyle={{ color: getEfficiencyColor(stats.avg_efficiency) }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="记录数" value={stats.count} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="工种数" value={stats.by_work_type?.length || 0} />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选 */}
      <Card size="small" className="filter-card glass-card">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="operator" label="操作者">
            <Input placeholder="操作者姓名" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="mold_no" label="模具编号">
            <Input placeholder="模具编号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="work_type" label="工种">
            <Select allowClear style={{ width: 120 }} placeholder="选择工种">
              {stats?.by_work_type?.map(w => (
                <Select.Option key={w.work_type} value={w.work_type}>{w.work_type}</Select.Option>
              ))}
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

      {/* 效率排行榜 */}
      {stats?.by_operator?.length > 0 && (
        <Card size="small" className="rank-card glass-card" title="👷 工人效率排行">
          <div className="rank-list">
            {stats.by_operator.slice(0, 6).map((op, i) => (
              <div key={op.operator} className="rank-item">
                <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                <span className="rank-name">{op.operator}</span>
                <span className="rank-hours">{op.total_hours?.toFixed(0)}H</span>
                <span className="rank-eff" style={{ color: getEfficiencyColor(op.avg_efficiency) }}>
                  {op.avg_efficiency?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 数据表格 */}
      <Card className="table-card glass-card">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
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
        title={editingRecord ? "编辑工时记录" : "新增工时记录"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        className="edit-modal"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mold_no" label="模具编号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operator" label="操作者">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="work_type" label="工种">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="process_category" label="加工类别">
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
            <Col span={8}>
              <Form.Item name="estimated_hours" label="预计工时">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actual_hours" label="实际工时">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="efficiency" label="效率(%)">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="process_qty" label="加工件数">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit_price" label="工价">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="amount_tax" label="含税金额">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="work_item" label="工作事项">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="work_content" label="工作内容">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkHours
