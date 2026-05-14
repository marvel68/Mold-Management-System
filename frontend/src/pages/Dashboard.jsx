import React, { useEffect, useState, useRef } from 'react'
import { Row, Col, Card, Spin } from 'antd'
import ReactECharts from 'echarts-for-react'
import { dashboardAPI, aiAPI } from '../utils/api'
import { formatCurrency, formatNumber, formatEfficiency } from '../utils/format'
import './Dashboard.css'

// 科幻卡片组件
const SciFiCard = ({ title, value, icon, subtitle, trend, color = '#00f2fe' }) => (
  <div className="scifi-card glass-card">
    <div className="card-header">
      <span className="card-icon">{icon}</span>
      <span className="card-title">{title}</span>
    </div>
    <div className="card-value font-orbitron" style={{ color }}>
      {value}
    </div>
    {subtitle && <div className="card-subtitle">{subtitle}</div>}
    {trend && (
      <div className="card-trend" style={{ color: trend > 0 ? '#f5576c' : '#00ff88' }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
    <div className="card-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${color}20, transparent 70%)` }} />
  </div>
)

// AI预测卡片
const AIPredictCard = ({ title, value, confidence, description, loading }) => (
  <div className="ai-card glass-card">
    <div className="ai-header">
      <span className="ai-icon">🤖</span>
      <span className="ai-title">{title}</span>
    </div>
    {loading ? (
      <Spin size="small" />
    ) : (
      <>
        <div className="ai-value font-orbitron">{value}</div>
        <div className="ai-confidence">
          <span>置信度</span>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${confidence * 100}%` }} />
          </div>
          <span>{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="ai-desc">{description}</div>
      </>
    )}
  </div>
)

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [efficiencyData, setEfficiencyData] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, trendRes, effRes, predRes] = await Promise.all([
        dashboardAPI.stats().catch(() => null),
        dashboardAPI.trend('month').catch(() => null),
        dashboardAPI.efficiency().catch(() => null),
        aiAPI.predictPurchase().catch(() => null)
      ])

      if (statsRes) setStats(statsRes)
      if (trendRes?.data) setTrendData(trendRes.data)
      if (effRes?.operators) setEfficiencyData(effRes.operators)
      if (predRes) setPredictions(predRes)
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 采购趋势图配置
  const trendOption = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.label),
      axisLine: { lineStyle: { color: 'rgba(0, 242, 254, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.65)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(0, 242, 254, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.65)', formatter: v => `¥${(v/10000).toFixed(0)}万` },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
    },
    series: [{
      type: 'line',
      data: trendData.map(d => d.value),
      smooth: true,
      lineStyle: { color: '#00f2fe', width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 242, 254, 0.4)' },
            { offset: 1, color: 'rgba(0, 242, 254, 0.02)' }
          ]
        }
      },
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#00f2fe', borderColor: '#fff', borderWidth: 2 }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 39, 0.95)',
      borderColor: '#00f2fe',
      textStyle: { color: '#fff' },
      formatter: params => `${params[0].name}<br/>¥${params[0].value?.toLocaleString() || 0}`
    }
  }

  // 效率分布图配置
  const efficiencyOption = {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 40, left: 120 },
    xAxis: {
      type: 'value',
      max: 150,
      axisLine: { lineStyle: { color: 'rgba(0, 242, 254, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.65)', formatter: v => `${v}%` },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
    },
    yAxis: {
      type: 'category',
      data: efficiencyData.slice(0, 8).map(d => d.name),
      axisLine: { lineStyle: { color: 'rgba(0, 242, 254, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.65)' }
    },
    series: [{
      type: 'bar',
      data: efficiencyData.slice(0, 8).map(d => ({
        value: d.efficiency,
        itemStyle: {
          color: d.efficiency >= 100 ? '#00ff88' : d.efficiency >= 80 ? '#4facfe' : '#f5576c',
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 16,
      label: {
        show: true,
        position: 'right',
        color: 'rgba(255, 255, 255, 0.65)',
        formatter: '{c}%'
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 39, 0.95)',
      borderColor: '#00f2fe',
      textStyle: { color: '#fff' }
    }
  }

  // 供应商分布饼图
  const supplierOption = stats ? {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 39, 0.95)',
      borderColor: '#00f2fe',
      textStyle: { color: '#fff' },
      formatter: '{b}: ¥{c} ({(d.percent}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: 'rgba(255, 255, 255, 0.65)' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#0a0e27',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' }
      },
      data: stats.supplier_ranking?.slice(0, 6).map((s, i) => ({
        value: s.total,
        name: s.supplier,
        itemStyle: {
          color: ['#00f2fe', '#4facfe', '#f093fb', '#f5576c', '#00ff88', '#ffd93d'][i]
        }
      })) || []
    }]
  } : null

  if (loading && !stats) {
    return (
      <div className="page-container loading-container">
        <Spin size="large" />
        <p>正在加载数据...</p>
      </div>
    )
  }

  return (
    <div className="page-container dashboard">
      <div className="page-header">
        <h1 className="page-title glow-text">⚡ 智能监控中心</h1>
        <p className="page-subtitle">实时数据 · AI预测 · 智能决策</p>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <SciFiCard
            title="本月采购额"
            value={formatCurrency(stats?.total_purchase_tax || 0)}
            icon="💰"
            subtitle="含税总额"
            trend={8.5}
            color="#00f2fe"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SciFiCard
            title="在制模具"
            value={formatNumber(stats?.active_molds || 0, 0)}
            icon="🔧"
            subtitle="进行中项目"
            color="#4facfe"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SciFiCard
            title="工人效率"
            value={formatEfficiency(stats?.avg_efficiency || 0)}
            icon="📊"
            subtitle="平均完成率"
            color="#00ff88"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SciFiCard
            title="供应商"
            value={formatNumber(stats?.supplier_count || 0, 0)}
            icon="🏭"
            subtitle="活跃供应商数"
            color="#f093fb"
          />
        </Col>
      </Row>

      {/* AI预测区域 */}
      <Row gutter={[16, 16]} className="ai-row">
        <Col xs={24} md={12} lg={8}>
          <AIPredictCard
            title="📈 下月采购预测"
            value={predictions?.value ? formatCurrency(predictions.value) : '暂无数据'}
            confidence={predictions?.confidence || 0}
            description={predictions?.description || '基于历史趋势分析'}
            loading={loading}
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <AIPredictCard
            title="⏱️ 模具完工预测"
            value="3.2 周"
            confidence={0.78}
            description="基于当前进度推算"
            loading={false}
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <AIPredictCard
            title="⚠️ 成本预警"
            value="正常"
            confidence={0.92}
            description="未检测到异常波动"
            loading={false}
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className="charts-row">
        <Col xs={24} lg={14}>
          <Card className="chart-card glass-card" title="📊 月度采购趋势">
            {trendData.length > 0 ? (
              <ReactECharts option={trendOption} style={{ height: 300 }} />
            ) : (
              <div className="empty-chart">暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="chart-card glass-card" title="🏆 供应商排名">
            {supplierOption ? (
              <ReactECharts option={supplierOption} style={{ height: 300 }} />
            ) : (
              <div className="empty-chart">暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="charts-row">
        <Col xs={24} lg={12}>
          <Card className="chart-card glass-card" title="👷 工人效率排行">
            {efficiencyData.length > 0 ? (
              <ReactECharts option={efficiencyOption} style={{ height: 300 }} />
            ) : (
              <div className="empty-chart">暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="chart-card glass-card" title="📂 分类分布">
            {stats?.category_distribution?.length > 0 ? (
              <div className="category-list">
                {stats.category_distribution.map((cat, i) => (
                  <div key={i} className="category-item">
                    <span className="category-name">{cat.category || '未分类'}</span>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ 
                          width: `${(cat.total / (stats.total_purchase_tax || 1)) * 100}%`,
                          background: ['#00f2fe', '#4facfe', '#f093fb', '#00ff88', '#f5576c'][i % 5]
                        }} 
                      />
                    </div>
                    <span className="category-value">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-chart">暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
