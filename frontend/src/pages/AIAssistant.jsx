import React, { useEffect, useState } from 'react'
import { Card, Row, Col, List, Tag, Button, Spin, message } from 'antd'
import { 
  RobotOutlined, 
  ThunderboltOutlined, 
  WarningOutlined, 
  BellOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { aiAPI } from '../utils/api'
import { formatCurrency, formatEfficiency } from '../utils/format'
import './AIAssistant.css'

function AIAssistant() {
  const [loading, setLoading] = useState(false)
  const [efficiencyWarnings, setEfficiencyWarnings] = useState([])
  const [supplierAlerts, setSupplierAlerts] = useState([])
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [effRes, supplierRes, predRes] = await Promise.all([
        aiAPI.predictEfficiency().catch(() => null),
        aiAPI.predictSupplier().catch(() => null),
        aiAPI.predictPurchase().catch(() => null)
      ])

      if (effRes) setEfficiencyWarnings(effRes.warnings || [])
      if (supplierRes) setSupplierAlerts(supplierRes.alerts || [])
      if (predRes) setPrediction(predRes)
    } catch (err) {
      console.error('加载数据失败', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🤖 AI智能助手</h1>
        <Button icon={<ReloadOutlined />} onClick={loadAllData} loading={loading}>
          刷新数据
        </Button>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>AI正在分析数据...</p>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {/* 采购预测 */}
          <Col xs={24} lg={12}>
            <Card className="ai-card glass-card" title={
              <span><ThunderboltOutlined /> 采购成本预测</span>
            }>
              {prediction ? (
                <div className="prediction-content">
                  <div className="prediction-value font-orbitron">
                    {formatCurrency(prediction.value)}
                  </div>
                  <div className="prediction-desc">
                    <span>下月采购额预测</span>
                    <Tag color="cyan">置信度 {(prediction.confidence * 100).toFixed(0)}%</Tag>
                  </div>
                  <div className="prediction-tip">
                    📊 {prediction.description}
                  </div>
                </div>
              ) : (
                <div className="empty-ai">暂无预测数据</div>
              )}
            </Card>
          </Col>

          {/* 效率预警 */}
          <Col xs={24} lg={12}>
            <Card className="ai-card glass-card" title={
              <span><WarningOutlined /> 效率异常预警</span>
            }>
              {efficiencyWarnings.length > 0 ? (
                <List
                  size="small"
                  dataSource={efficiencyWarnings}
                  renderItem={item => (
                    <List.Item className="warning-item">
                      <div className="warning-info">
                        <span className="warning-name">{item.operator}</span>
                        <span className="warning-issue">{item.issue}</span>
                      </div>
                      <Tag color="orange">{formatEfficiency(item.efficiency)}</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="empty-ai success">
                  ✅ 未检测到效率异常
                </div>
              )}
            </Card>
          </Col>

          {/* 供应商预警 */}
          <Col xs={24} lg={12}>
            <Card className="ai-card glass-card" title={
              <span><BellOutlined /> 供应商价格波动</span>
            }>
              {supplierAlerts.length > 0 ? (
                <List
                  size="small"
                  dataSource={supplierAlerts}
                  renderItem={item => (
                    <List.Item className="warning-item">
                      <div className="warning-info">
                        <span className="warning-name">{item.supplier}</span>
                        <span className="warning-issue">{item.issue}</span>
                      </div>
                      <Tag color="red">波动 {item.fluctuation}%</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="empty-ai success">
                  ✅ 供应商价格稳定
                </div>
              )}
            </Card>
          </Col>

          {/* AI功能说明 */}
          <Col xs={24} lg={12}>
            <Card className="ai-card glass-card" title={
              <span><RobotOutlined /> AI助手功能</span>
            }>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">📈</span>
                  <div className="feature-content">
                    <h4>采购预测</h4>
                    <p>基于历史数据预测下月采购额，帮助做好预算规划</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⏱️</span>
                  <div className="feature-content">
                    <h4>工时分析</h4>
                    <p>监控工人效率，识别异常并及时预警</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💰</span>
                  <div className="feature-content">
                    <h4>成本预警</h4>
                    <p>监控供应商价格波动，防范采购风险</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔧</span>
                  <div className="feature-content">
                    <h4>报价计算</h4>
                    <p>输入尺寸自动计算散件加工报价</p>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* 快捷操作 */}
          <Col span={24}>
            <Card className="ai-card glass-card" title="⚡ 快捷操作">
              <Row gutter={16}>
                <Col span={6}>
                  <Button className="quick-action" onClick={() => window.location.href = '/purchase'}>
                    <span className="qa-icon">💰</span>
                    <span className="qa-text">采购分析</span>
                  </Button>
                </Col>
                <Col span={6}>
                  <Button className="quick-action" onClick={() => window.location.href = '/work-hours'}>
                    <span className="qa-icon">⏱️</span>
                    <span className="qa-text">工时统计</span>
                  </Button>
                </Col>
                <Col span={6}>
                  <Button className="quick-action" onClick={() => window.location.href = '/part-prices'}>
                    <span className="qa-icon">💎</span>
                    <span className="qa-text">标准价查询</span>
                  </Button>
                </Col>
                <Col span={6}>
                  <Button className="quick-action" onClick={() => window.location.href = '/molds'}>
                    <span className="qa-icon">🔧</span>
                    <span className="qa-text">模具管理</span>
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default AIAssistant
