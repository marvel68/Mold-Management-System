import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Input, Select, Table, Tag, Button, message, Modal, Descriptions, Tabs, Upload, Space } from 'antd'
import { SearchOutlined, CalculatorOutlined, InfoCircleOutlined, UploadOutlined, FileOutlined, InboxOutlined } from '@ant-design/icons'
import { partPriceAPI, attachmentAPI } from '../utils/api'
import { formatNumber, formatCurrency } from '../utils/format'
import AttachmentPreview from '../components/AttachmentPreview'
import './PartPrices.css'

const { Dragger } = Upload

function PartPrices() {
  const [activeTab, setActiveTab] = useState('pricing')
  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [selectedPart, setSelectedPart] = useState(null)
  const [calcModalVisible, setCalcModalVisible] = useState(false)
  const [calcParams, setCalcParams] = useState({
    part_code: '',
    length: '',
    width: '',
    height: ''
  })
  const [calcResult, setCalcResult] = useState(null)
  
  // 附件相关
  const [attachments, setAttachments] = useState([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [attachmentCategory, setAttachmentCategory] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  useEffect(() => {
    loadCategories()
    loadData()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await partPriceAPI.categories()
      setCategories(res)
    } catch (err) {
      console.error('加载分类失败', err)
    }
  }

  const loadData = async (params = {}) => {
    try {
      setLoading(true)
      const res = await partPriceAPI.list({ ...filters, ...params })
      setData(res)
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadAttachments = async () => {
    try {
      setAttachmentsLoading(true)
      const params = {}
      if (attachmentCategory) params.category = attachmentCategory
      const res = await attachmentAPI.list(params)
      setAttachments(res.items || res || [])
    } catch (err) {
      message.error('加载附件失败')
    } finally {
      setAttachmentsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'attachments') {
      loadAttachments()
    }
  }, [activeTab, attachmentCategory])

  const handleSearch = (values) => {
    setFilters({
      part_code: values.part_code,
      part_name: values.part_name,
      size_type: values.size_type
    })
    loadData()
  }

  const handleCalculate = async () => {
    if (!calcParams.part_code || !calcParams.length || !calcParams.width || !calcParams.height) {
      message.warning('请填写完整参数')
      return
    }

    try {
      const res = await partPriceAPI.calculate({
        part_code: calcParams.part_code,
        length: parseFloat(calcParams.length),
        width: parseFloat(calcParams.width),
        height: parseFloat(calcParams.height)
      })
      setCalcResult(res)
    } catch (err) {
      message.error('计算失败')
    }
  }

  const handleUpload = async (file) => {
    try {
      setUploadLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      if (attachmentCategory) formData.append('category', attachmentCategory)
      
      await attachmentAPI.upload(formData)
      message.success('上传成功')
      loadAttachments()
    } catch (err) {
      message.error('上传失败')
    } finally {
      setUploadLoading(false)
    }
    return false
  }

  const handleDeleteAttachment = async (id) => {
    try {
      await attachmentAPI.delete(id)
      message.success('删除成功')
      loadAttachments()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const columns = [
    { 
      title: '代码', 
      dataIndex: 'part_code', 
      width: 90,
      render: v => <Tag color="cyan">{v}</Tag>
    },
    { title: '散件名称', dataIndex: 'part_name', width: 150 },
    { 
      title: '规格', 
      dataIndex: 'size_type', 
      width: 80,
      render: v => {
        const colors = { '小型': 'green', '中型': 'blue', '大型': 'orange' }
        return <Tag color={colors[v]}>{v}</Tag>
      }
    },
    { title: '长(mm)', dataIndex: 'length', width: 80, align: 'right' },
    { title: '宽(mm)', dataIndex: 'width', width: 80, align: 'right' },
    { title: '高(mm)', dataIndex: 'height', width: 80, align: 'right' },
    { 
      title: '成本', 
      dataIndex: 'total_cost', 
      width: 110, 
      align: 'right',
      render: v => v ? `¥${formatNumber(v)}` : '-'
    },
    { 
      title: '报价(含税)', 
      dataIndex: 'final_price', 
      width: 120, 
      align: 'right',
      render: v => v ? (
        <span className="font-orbitron" style={{ color: '#00f2fe', fontWeight: 600 }}>
          ¥{formatNumber(v)}
        </span>
      ) : '-'
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<InfoCircleOutlined />}
          onClick={() => setSelectedPart(record)}
        >
          详情
        </Button>
      )
    }
  ]

  // 工序字段映射
  const processFields = [
    { key: 'steel_cost_1', label: '钢材费用1' },
    { key: 'steel_cost_2', label: '钢材费用2' },
    { key: 'milling', label: '铣床' },
    { key: 'cnc_programming', label: 'CNC编程' },
    { key: 'cnc_roughing', label: 'CNC开粗' },
    { key: 'heat_treatment', label: '热处理' },
    { key: 'grinding', label: '磨床' },
    { key: 'cnc_finishing', label: 'CNC精加工' },
    { key: 'slow_wire', label: '慢走丝' },
    { key: 'medium_wire', label: '中走丝' },
    { key: 'fast_wire', label: '快走丝' },
    { key: 'edm', label: '放电' },
    { key: 'polishing', label: '省模' },
    { key: 'lathe', label: '车床' },
    { key: 'deep_hole', label: '深孔钻' },
    { key: 'measurement', label: '测量' },
    { key: 'assembly', label: '装配' }
  ]

  // Tab内容
  const renderPricingTab = () => (
    <>
      <Card size="small" className="filter-card glass-card">
        <Row gutter={16}>
          <Col span={6}>
            <Input 
              placeholder="散件代码 (如10.01)" 
              prefix={<SearchOutlined />}
              onChange={e => setFilters(f => ({ ...f, part_code: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Input 
              placeholder="散件名称" 
              onChange={e => setFilters(f => ({ ...f, part_name: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select 
              placeholder="规格" 
              allowClear
              style={{ width: '100%' }}
              onChange={v => setFilters(f => ({ ...f, size_type: v }))}
            >
              <Select.Option value="小型">小型</Select.Option>
              <Select.Option value="中型">中型</Select.Option>
              <Select.Option value="大型">大型</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={() => loadData()}>搜索</Button>
          </Col>
        </Row>
      </Card>

      <Card size="small" className="category-card glass-card" title="📂 散件分类">
        <div className="category-tags">
          {categories.map(cat => (
            <Tag 
              key={cat.code} 
              className="category-tag"
              onClick={() => {
                setFilters({ part_code: cat.code })
                loadData({ part_code: cat.code })
              }}
            >
              {cat.code} {cat.name}
            </Tag>
          ))}
        </div>
      </Card>

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
    </>
  )

  const renderSuppliersTab = () => (
    <div className="external-page-redirect">
      <Card className="glass-card redirect-card">
        <div className="redirect-content">
          <span className="redirect-icon">🏭</span>
          <h3>供应商管理</h3>
          <p>点击下方按钮跳转到供应商管理页面</p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => window.location.href = '/suppliers'}
          >
            前往供应商管理
          </Button>
        </div>
      </Card>
    </div>
  )

  const renderAttachmentsTab = () => (
    <>
      <Card className="glass-card">
        <div className="attachment-filters">
          <Space>
            <Select
              placeholder="按分类筛选"
              value={attachmentCategory}
              onChange={setAttachmentCategory}
              style={{ width: 150 }}
              allowClear
              options={[
                { value: '模胚', label: '模胚类' },
                { value: '热流道', label: '热流道类' },
                { value: '钢材', label: '钢材类' },
                { value: '配件', label: '配件类' },
                { value: '其他', label: '其他类' }
              ]}
            />
            <Button onClick={loadAttachments}>刷新</Button>
          </Space>
        </div>

        <Dragger
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={uploadLoading}
          multiple={false}
          className="attachment-uploader"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽上传附件</p>
          <p className="ant-upload-hint">支持图片、PDF、Word、Excel等文件</p>
        </Dragger>

        <div className="attachment-list-container">
          {attachmentsLoading ? (
            <div className="attachment-loading">加载中...</div>
          ) : attachments.length === 0 ? (
            <div className="attachment-empty">暂无附件</div>
          ) : (
            <div className="attachment-grid">
              {attachments.map(att => (
                <AttachmentPreview
                  key={att.id}
                  file={att}
                  showDelete
                  onDelete={handleDeleteAttachment}
                  style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  )

  const tabItems = [
    { key: 'pricing', label: '💎 散件报价', children: renderPricingTab() },
    { key: 'suppliers', label: '🏭 供应商管理', children: renderSuppliersTab() },
    { key: 'attachments', label: '📎 附件管理', children: renderAttachmentsTab() }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💎 散件标准价查询</h1>
        <Button 
          type="primary" 
          icon={<CalculatorOutlined />} 
          onClick={() => setCalcModalVisible(true)}
        >
          尺寸计算报价
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
        className="part-prices-tabs"
      />

      {/* 详情弹窗 */}
      <Modal
        title="散件详情"
        open={!!selectedPart}
        onCancel={() => setSelectedPart(null)}
        footer={null}
        width={700}
        className="detail-modal"
      >
        {selectedPart && (
          <div className="part-detail">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="代码">{selectedPart.part_code}</Descriptions.Item>
              <Descriptions.Item label="名称">{selectedPart.part_name}</Descriptions.Item>
              <Descriptions.Item label="规格">{selectedPart.size_type}</Descriptions.Item>
              <Descriptions.Item label="尺寸">{selectedPart.length}×{selectedPart.width}×{selectedPart.height} mm</Descriptions.Item>
              <Descriptions.Item label="成本" span={2}>¥{formatNumber(selectedPart.total_cost)}</Descriptions.Item>
              <Descriptions.Item label="含税报价(报价)" span={2}>
                <span className="font-orbitron" style={{ color: '#00f2fe', fontSize: 18 }}>
                  ¥{formatNumber(selectedPart.final_price)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 20, marginBottom: 12 }}>工序成本分解</h4>
            <div className="process-list">
              {processFields.map(pf => (
                selectedPart[pf.key] > 0 && (
                  <div key={pf.key} className="process-item">
                    <span className="process-name">{pf.label}</span>
                    <span className="process-value">¥{formatNumber(selectedPart[pf.key])}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 尺寸计算弹窗 */}
      <Modal
        title="📐 尺寸计算报价"
        open={calcModalVisible}
        onCancel={() => { setCalcModalVisible(false); setCalcResult(null); }}
        footer={[
          <Button key="calc" type="primary" onClick={handleCalculate}>计算</Button>,
          <Button key="close" onClick={() => setCalcModalVisible(false)}>关闭</Button>
        ]}
        width={600}
        className="calc-modal"
      >
        <div className="calc-form">
          <Row gutter={16}>
            <Col span={24}>
              <div className="calc-field">
                <label>散件代码</label>
                <Select
                  placeholder="选择散件"
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  onChange={v => setCalcParams(p => ({ ...p, part_code: v }))}
                >
                  {categories.map(cat => (
                    <Select.Option key={cat.code} value={cat.code}>
                      {cat.code} {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={8}>
              <div className="calc-field">
                <label>长度(mm)</label>
                <Input 
                  type="number" 
                  placeholder="长度"
                  value={calcParams.length}
                  onChange={e => setCalcParams(p => ({ ...p, length: e.target.value }))}
                />
              </div>
            </Col>
            <Col span={8}>
              <div className="calc-field">
                <label>宽度(mm)</label>
                <Input 
                  type="number" 
                  placeholder="宽度"
                  value={calcParams.width}
                  onChange={e => setCalcParams(p => ({ ...p, width: e.target.value }))}
                />
              </div>
            </Col>
            <Col span={8}>
              <div className="calc-field">
                <label>高度(mm)</label>
                <Input 
                  type="number" 
                  placeholder="高度"
                  value={calcParams.height}
                  onChange={e => setCalcParams(p => ({ ...p, height: e.target.value }))}
                />
              </div>
            </Col>
          </Row>

          {calcResult && (
            <div className="calc-result">
              <div className="result-header">
                {calcResult.recommended && <Tag color="cyan">推荐规格</Tag>}
                <span className="result-size">{calcResult.part?.size_type}</span>
              </div>
              <div className="result-match">
                <span>输入: {calcParams.length}×{calcParams.width}×{calcParams.height}mm</span>
                <span>→</span>
                <span>匹配: {calcResult.match_dimensions?.length}×{calcResult.match_dimensions?.width}×{calcResult.match_dimensions?.height}mm</span>
              </div>
              <div className="result-price">
                <span>推荐报价:</span>
                <span className="font-orbitron">¥{formatNumber(calcResult.part?.final_price)}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default PartPrices
