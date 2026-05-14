import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Table, Button, Input, Select, Tag, Modal, Descriptions, message, Statistic } from 'antd'
import { PlusOutlined, AppstoreOutlined, ProfileOutlined } from '@ant-design/icons'
import { moldAPI } from '../utils/api'
import { formatCurrency, formatDate, formatNumber } from '../utils/format'
import './Molds.css'

function Molds() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [selectedMold, setSelectedMold] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    loadData()
    loadStats()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await moldAPI.list(filters)
      setData(res)
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await moldAPI.stats()
      setStats(res)
    } catch (err) {
      console.error('加载统计失败', err)
    }
  }

  const handleViewDetail = async (record) => {
    try {
      const res = await moldAPI.getByNo(record.mold_no)
      setSelectedMold(res)
      setDetailVisible(true)
    } catch (err) {
      message.error('加载详情失败')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'planned': 'default',
      'in_progress': 'processing',
      'completed': 'success'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'planned': '计划中',
      'in_progress': '进行中',
      'completed': '已完成'
    }
    return texts[status] || status
  }

  const columns = [
    { title: '模具编号', dataIndex: 'mold_no', width: 150,
      render: v => <Tag color="cyan">{v}</Tag> },
    { title: '模具名称', dataIndex: 'mold_name', ellipsis: true },
    { title: '项目', dataIndex: 'project', width: 80,
      render: v => {
        const colors = { '新模': 'cyan', '消耗': 'orange', '重工': 'red', '量产': 'green' }
        return <Tag color={colors[v]}>{v}</Tag>
      }
    },
    { title: '状态', dataIndex: 'status', width: 100,
      render: v => <Tag color={getStatusColor(v)}>{getStatusText(v)}</Tag> },
    { title: '开始日期', dataIndex: 'start_date', width: 110, render: formatDate },
    { title: '预计完成', dataIndex: 'expected_end_date', width: 110, render: formatDate },
    { title: '采购成本', dataIndex: 'purchase_cost', width: 120, align: 'right',
      render: v => v ? formatCurrency(v) : '-' },
    { title: '内部成本', dataIndex: 'internal_cost', width: 120, align: 'right',
      render: v => v ? formatCurrency(v) : '-' },
    { title: '总成本', dataIndex: 'total_cost', width: 130, align: 'right',
      render: v => v ? (
        <span className="font-orbitron" style={{ color: '#00f2fe' }}>{formatCurrency(v)}</span>
      ) : '-' },
    { 
      title: '操作', 
      width: 80,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<ProfileOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🔧 模具管理</h1>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} className="stats-row">
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="模具总数" value={stats.total_molds} prefix={<AppstoreOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic 
                title="进行中" 
                value={stats.by_status?.find(s => s.status === 'in_progress')?.count || 0} 
                valueStyle={{ color: '#4facfe' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic 
                title="已完成" 
                value={stats.by_status?.find(s => s.status === 'completed')?.count || 0} 
                valueStyle={{ color: '#00ff88' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card glass-card">
              <Statistic title="涉及模具编号" value={stats.unique_mold_nos} />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选 */}
      <Card size="small" className="filter-card glass-card">
        <Row gutter={16}>
          <Col span={6}>
            <Input 
              placeholder="模具编号" 
              onChange={e => setFilters(f => ({ ...f, mold_no: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select 
              placeholder="项目" 
              allowClear
              style={{ width: '100%' }}
              onChange={v => setFilters(f => ({ ...f, project: v }))}
            >
              <Select.Option value="新模">新模</Select.Option>
              <Select.Option value="消耗">消耗</Select.Option>
              <Select.Option value="重工">重工</Select.Option>
              <Select.Option value="量产">量产</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select 
              placeholder="状态" 
              allowClear
              style={{ width: '100%' }}
              onChange={v => setFilters(f => ({ ...f, status: v }))}
            >
              <Select.Option value="planned">计划中</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={loadData}>搜索</Button>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card className="table-card glass-card">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title={`模具详情 - ${selectedMold?.mold_no}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
        className="detail-modal"
      >
        {selectedMold && (
          <div className="mold-detail">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" className="cost-card glass-card">
                  <Statistic title="采购成本" value={selectedMold.purchase_cost} prefix="¥" />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="cost-card glass-card">
                  <Statistic title="内部工时成本" value={selectedMold.internal_cost} prefix="¥" />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="cost-card glass-card total">
                  <Statistic title="总成本" value={selectedMold.total_cost} prefix="¥" valueStyle={{ color: '#00f2fe' }} />
                </Card>
              </Col>
            </Row>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>📦 采购明细</h4>
            {selectedMold.purchases?.length > 0 ? (
              <Table
                size="small"
                dataSource={selectedMold.purchases}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '日期', dataIndex: 'delivery_date', width: 100, render: formatDate },
                  { title: '供应商', dataIndex: 'supplier', width: 100 },
                  { title: '内容', dataIndex: 'content', ellipsis: true },
                  { title: '金额', dataIndex: 'amount_tax', width: 100, align: 'right', render: v => formatCurrency(v) }
                ]}
              />
            ) : (
              <div className="empty-data">暂无采购记录</div>
            )}

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>⏱️ 工时明细</h4>
            {selectedMold.work_hours?.length > 0 ? (
              <Table
                size="small"
                dataSource={selectedMold.work_hours}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '日期', dataIndex: 'date', width: 100, render: formatDate },
                  { title: '操作者', dataIndex: 'operator', width: 100 },
                  { title: '工作事项', dataIndex: 'work_item', ellipsis: true },
                  { title: '工时', dataIndex: 'actual_hours', width: 80, align: 'right', render: v => `${v}H` },
                  { title: '金额', dataIndex: 'amount_tax', width: 100, align: 'right', render: v => formatCurrency(v) }
                ]}
              />
            ) : (
              <div className="empty-data">暂无工时记录</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Molds
