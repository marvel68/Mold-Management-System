import React, { useEffect, useState, useRef } from 'react'
import { Card, Row, Col, Button, Select, Spin, message, Tooltip } from 'antd'
import { BarChartOutlined, DownloadOutlined } from '@ant-design/icons'
import { weeklyPivotAPI } from '../utils/api'
import { formatCurrency } from '../utils/format'
import './WeeklyPivot.css'

// 月份配置
const MONTHS = [
  { value: 1, label: '01月' },
  { value: 2, label: '02月' },
  { value: 3, label: '03月' },
  { value: 4, label: '04月' },
  { value: 5, label: '05月' },
  { value: 6, label: '06月' },
  { value: 7, label: '07月' },
  { value: 8, label: '08月' },
  { value: 9, label: '09月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' },
  { value: 0, label: '全年' }
]

// 加工类别
const CATEGORIES = [
  { value: '模胚', label: '模胚类' },
  { value: '热流道', label: '热流道类' },
  { value: '钢材', label: '钢材类' },
  { value: '铜材', label: '铜材类' },
  { value: '配件', label: '配件类' },
  { value: '外协加工', label: '外协加工类' },
  { value: '其他', label: '其他类' }
]

function WeeklyPivot() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [category, setCategory] = useState(null)
  const [data, setData] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [weeks, setWeeks] = useState([])
  const tableRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [year, month])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = { year }
      if (month > 0) params.month = month
      if (category) params.category = category
      
      const res = await weeklyPivotAPI.getData(params)
      
      if (res.data) {
        setData(res.data)
        setSuppliers(res.suppliers || extractSuppliers(res.data))
        setWeeks(res.weeks || generateWeeks(year, month))
      }
    } catch (err) {
      console.error('加载数据失败', err)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 从数据中提取供应商列表
  const extractSuppliers = (dataList) => {
    const supplierSet = new Set()
    dataList.forEach(item => {
      if (item.supplier) supplierSet.add(item.supplier)
    })
    return Array.from(supplierSet).sort()
  }

  // 生成周次列表
  const generateWeeks = (y, m) => {
    const weeksList = []
    if (m === 0) {
      // 全年
      for (let month = 1; month <= 12; month++) {
        const weeksInMonth = getWeeksInMonth(y, month)
        for (let w = 1; w <= weeksInMonth; w++) {
          weeksList.push({ week: `${month}-${w}`, label: `${month}月第${w}周` })
        }
      }
    } else {
      const weeksInMonth = getWeeksInMonth(y, m)
      for (let w = 1; w <= weeksInMonth; w++) {
        weeksList.push({ week: w, label: `第${w}周` })
      }
    }
    return weeksList
  }

  // 获取某月的周数
  const getWeeksInMonth = (y, m) => {
    const firstDay = new Date(y, m - 1, 1)
    const lastDay = new Date(y, m, 0)
    const daysInMonth = lastDay.getDate()
    const firstWeekday = firstDay.getDay() || 7
    return Math.ceil((daysInMonth + firstWeekday - 1) / 7)
  }

  // 获取某周日期范围
  const getWeekDateRange = (weekNum, y, m) => {
    const firstDay = new Date(y, m - 1, 1)
    const lastDay = new Date(y, m, 0)
    const daysInMonth = lastDay.getDate()
    const firstWeekday = firstDay.getDay() || 7
    const startOffset = (weekNum - 1) * 7 - (firstWeekday - 1)
    const startDate = new Date(y, m - 1, Math.max(1, startOffset + 1))
    const endDate = new Date(y, m - 1, Math.min(daysInMonth, startOffset + 7))
    
    const fmt = d => `${d.getMonth() + 1}.${d.getDate()}`
    return `${fmt(startDate)}-${fmt(endDate)}`
  }

  // 格式化金额
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '-'
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // 构建表格数据
  const buildTableData = () => {
    // 按供应商和类别分组
    const grouped = {}
    
    data.forEach(item => {
      const supplier = item.supplier || '未知供应商'
      const cat = item.category || '其他'
      const key = `${supplier}__${cat}`
      
      if (!grouped[key]) {
        grouped[key] = {
          supplier,
          category: cat,
          weeks: {},
          total: 0
        }
      }
      
      const weekKey = item.week?.toString() || '1'
      grouped[key].weeks[weekKey] = (grouped[key].weeks[weekKey] || 0) + (item.amount || 0)
      grouped[key].total += item.amount || 0
    })
    
    return Object.values(grouped).sort((a, b) => {
      if (a.supplier !== b.supplier) return a.supplier.localeCompare(b.supplier)
      return a.category.localeCompare(b.category)
    })
  }

  // 计算总计行
  const calculateTotalRow = () => {
    const totals = { weeks: {}, total: 0 }
    
    data.forEach(item => {
      const weekKey = item.week?.toString() || '1'
      totals.weeks[weekKey] = (totals.weeks[weekKey] || 0) + (item.amount || 0)
      totals.total += item.amount || 0
    })
    
    return totals
  }

  const tableData = buildTableData()
  const totalRow = calculateTotalRow()

  // 导出Excel（暂不实现）
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  return (
    <div className="page-container weekly-pivot">
      <div className="page-header">
        <h1 className="page-title glow-text">📊 周透视表</h1>
        <p className="page-subtitle">采购数据按周次交叉分析</p>
      </div>

      {/* 筛选区域 */}
      <Card className="filter-card glass-card">
        <Row gutter={16} align="middle">
          <Col>
            <span className="filter-label">年份：</span>
            <Select
              value={year}
              onChange={setYear}
              style={{ width: 100 }}
              options={[
                { value: 2024, label: '2024年' },
                { value: 2025, label: '2025年' },
                { value: 2026, label: '2026年' }
              ]}
            />
          </Col>
          <Col>
            <span className="filter-label">月份：</span>
            <div className="month-buttons">
              {MONTHS.map(m => (
                <Button
                  key={m.value}
                  type={month === m.value ? 'primary' : 'default'}
                  onClick={() => setMonth(m.value)}
                  className={month === m.value ? 'month-btn-active' : ''}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </Col>
          <Col>
            <span className="filter-label">类别：</span>
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: 120 }}
              allowClear
              placeholder="全部类别"
              options={CATEGORIES}
            />
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card className="table-card glass-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>正在加载数据...</p>
          </div>
        ) : (
          <div className="table-wrapper" ref={tableRef}>
            <table className="pivot-table">
              <thead>
                <tr className="header-row">
                  <th className="th-seq">序号</th>
                  <th className="th-supplier">供应商</th>
                  <th className="th-category">加工类别</th>
                  {weeks.map(w => (
                    <th key={w.week} className="th-week">
                      <div className="week-num">{month === 0 ? w.label : `第${w.week}周`}</div>
                      <div className="week-date">
                        {month === 0 ? '' : getWeekDateRange(w.week, year, month > 0 ? month : 1)}
                      </div>
                    </th>
                  ))}
                  <th className="th-total">合计</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={weeks.length + 4} className="empty-cell">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, idx) => (
                    <tr key={`${row.supplier}-${row.category}`} className={idx % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td className="td-seq">{idx + 1}</td>
                      <td className="td-supplier">{row.supplier}</td>
                      <td className="td-category">
                        <span className={`category-tag category-${row.category}`}>{row.category}</span>
                      </td>
                      {weeks.map(w => {
                        const amount = row.weeks[w.week] || 0
                        return (
                          <td 
                            key={w.week} 
                            className={`td-amount ${amount > 0 ? 'has-data' : ''}`}
                          >
                            {formatAmount(amount)}
                          </td>
                        )
                      })}
                      <td className="td-total">{formatAmount(row.total)}</td>
                    </tr>
                  ))
                )}
                {/* 合计行 */}
                {tableData.length > 0 && (
                  <tr className="total-row">
                    <td className="td-seq" colSpan={2}>合计</td>
                    <td className="td-category">{tableData.length} 个组合</td>
                    {weeks.map(w => (
                      <td 
                        key={w.week} 
                        className={`td-amount total-cell ${(totalRow.weeks[w.week] || 0) > 0 ? 'has-data' : ''}`}
                      >
                        {formatAmount(totalRow.weeks[w.week] || 0)}
                      </td>
                    ))}
                    <td className="td-total total-cell">
                      <span className="font-orbitron total-amount">{formatAmount(totalRow.total)}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 统计信息 */}
      <Card className="stats-card glass-card">
        <Row gutter={24}>
          <Col span={8}>
            <div className="stat-item">
              <span className="stat-label">供应商数量</span>
              <span className="stat-value font-orbitron">{suppliers.length}</span>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-item">
              <span className="stat-label">数据组合</span>
              <span className="stat-value font-orbitron">{tableData.length}</span>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-item">
              <span className="stat-label">总金额</span>
              <span className="stat-value font-orbitron total-stat">{formatAmount(totalRow.total)}</span>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default WeeklyPivot
