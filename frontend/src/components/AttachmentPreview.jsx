import React, { useState } from 'react'
import { Modal, Image, Button, Space, message } from 'antd'
import { EyeOutlined, DownloadOutlined, DeleteOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, FileOutlined } from '@ant-design/icons'
import { attachmentAPI } from '../utils/api'

// 根据文件类型获取图标
const getFileIcon = (fileType) => {
  if (!fileType) return <FileOutlined />
  const type = fileType.toLowerCase()
  if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#f5576c' }} />
  if (type.includes('word') || type.includes('doc')) return <FileWordOutlined style={{ color: '#4facfe' }} />
  if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return <FileExcelOutlined style={{ color: '#00ff88' }} />
  if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return <FileImageOutlined style={{ color: '#f093fb' }} />
  return <FileOutlined style={{ color: '#fff' }} />
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 判断是否为图片
const isImage = (fileType, fileName) => {
  if (!fileType) return false
  const type = fileType.toLowerCase()
  const name = fileName?.toLowerCase() || ''
  return type.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/.test(name)
}

// 判断是否为PDF
const isPdf = (fileType, fileName) => {
  if (!fileType) return false
  const type = fileType.toLowerCase()
  const name = fileName?.toLowerCase() || ''
  return type.includes('pdf') || name.endsWith('.pdf')
}

// 判断是否为Word文档
const isWord = (fileType, fileName) => {
  if (!fileType) return false
  const type = fileType.toLowerCase()
  const name = fileName?.toLowerCase() || ''
  return type.includes('word') || type.includes('document') || /\.(doc|docx)$/.test(name)
}

// 判断是否为Excel
const isExcel = (fileType, fileName) => {
  if (!fileType) return false
  const type = fileType.toLowerCase()
  const name = fileName?.toLowerCase() || ''
  return type.includes('excel') || type.includes('sheet') || type.includes('spreadsheet') || /\.(xls|xlsx|csv)$/.test(name)
}

function AttachmentPreview({ 
  file, 
  showDownload = true, 
  showDelete = false, 
  onDelete,
  inline = false,
  style = {}
}) {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)

  if (!file) return null

  const fileName = file.file_name || file.name || '未知文件'
  const fileType = file.file_type || file.type || ''
  const fileSize = file.file_size || file.size
  const fileId = file.id

  // 处理预览
  const handlePreview = async () => {
    if (isImage(fileType, fileName)) {
      // 图片预览
      setPreviewUrl(file.url || `/api/attachments/${fileId}/download`)
      setPreviewVisible(true)
    } else if (isPdf(fileType, fileName)) {
      // PDF预览 - 新窗口打开
      window.open(file.url || `/api/attachments/${fileId}/download`, '_blank')
    } else if (isWord(fileType, fileName) || isExcel(fileType, fileName)) {
      // Word/Excel 提示下载
      message.info('请下载后查看')
      handleDownload()
    } else {
      message.info('该文件类型不支持在线预览')
    }
  }

  // 处理下载
  const handleDownload = async () => {
    try {
      setLoading(true)
      const response = await fetch(file.url || `/api/attachments/${fileId}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      message.error('下载失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理删除
  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件「${fileName}」吗？`,
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          if (onDelete) {
            await onDelete(fileId)
          } else {
            await attachmentAPI.delete(fileId)
          }
          message.success('删除成功')
        } catch (err) {
          message.error('删除失败')
        }
      }
    })
  }

  // 预览图片的URL
  const getPreviewUrl = () => {
    if (file.url) return file.url
    if (isImage(fileType, fileName)) return `/api/attachments/${fileId}/download`
    return null
  }

  const previewUrlForImage = getPreviewUrl()

  if (inline) {
    // 内联展示模式（用于附件列表）
    return (
      <div className="attachment-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, ...style }}>
        <span className="attachment-icon" style={{ fontSize: 24 }}>
          {isImage(fileType, fileName) && previewUrlForImage ? (
            <Image src={previewUrlForImage} alt={fileName} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} preview={{ src: previewUrlForImage }} />
          ) : (
            getFileIcon(fileType)
          )}
        </span>
        <div className="attachment-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{formatFileSize(fileSize)}</div>
        </div>
        <Space size={4}>
          {previewUrlForImage && (
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={handlePreview} />
          )}
          {showDownload && (
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={handleDownload} loading={loading} />
          )}
          {showDelete && (
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={handleDelete} />
          )}
        </Space>
        
        <Modal
          open={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="80%"
          centered
          className="attachment-preview-modal"
        >
          {previewUrl && <img src={previewUrl} alt={fileName} style={{ width: '100%' }} />}
        </Modal>
      </div>
    )
  }

  // 默认展示模式
  return (
    <div className="attachment-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...style }}>
      {isImage(fileType, fileName) && previewUrlForImage ? (
        <Image 
          src={previewUrlForImage} 
          alt={fileName}
          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
          preview={{ src: previewUrlForImage }}
        />
      ) : (
        <div 
          style={{ 
            width: 120, 
            height: 120, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 8,
            fontSize: 48
          }}
          onClick={handlePreview}
        >
          {getFileIcon(fileType)}
        </div>
      )}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{formatFileSize(fileSize)}</div>
      
      <Space size={8}>
        {previewUrlForImage && (
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setPreviewUrl(previewUrlForImage); setPreviewVisible(true); }} />
        )}
        {showDownload && (
          <Button type="text" size="small" icon={<DownloadOutlined />} onClick={handleDownload} loading={loading} />
        )}
        {showDelete && (
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={handleDelete} />
        )}
      </Space>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        centered
        className="attachment-preview-modal"
      >
        {previewUrl && <img src={previewUrl} alt={fileName} style={{ width: '100%' }} />}
      </Modal>
    </div>
  )
}

export default AttachmentPreview
