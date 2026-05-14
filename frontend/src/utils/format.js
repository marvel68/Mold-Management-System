// 数字格式化
export const formatNumber = (num, decimals = 2) => {
  if (num == null) return '-'
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// 金额格式化
export const formatCurrency = (num) => {
  if (num == null) return '-'
  if (num >= 10000) {
    return `¥${(num / 10000).toFixed(1)}万`
  }
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

// 效率格式化
export const formatEfficiency = (num) => {
  if (num == null) return '-'
  return `${Number(num).toFixed(1)}%`
}

// 日期格式化
export const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 百分比格式化
export const formatPercent = (num) => {
  if (num == null) return '-'
  return `${(num * 100).toFixed(1)}%`
}
