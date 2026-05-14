import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#00f2fe',
            colorBgContainer: 'rgba(13, 18, 48, 0.95)',
            colorBgElevated: '#0d1230',
            colorBgLayout: '#0a0e27',
            colorBorder: 'rgba(0, 242, 254, 0.2)',
            colorText: 'rgba(255, 255, 255, 0.85)',
            colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
            borderRadius: 8,
            colorLink: '#00f2fe',
          },
          components: {
            Card: {
              colorBgContainer: 'rgba(13, 18, 48, 0.8)',
              colorBorderSecondary: 'rgba(0, 242, 254, 0.15)',
            },
            Table: {
              colorBgContainer: 'transparent',
              headerBg: 'rgba(0, 242, 254, 0.1)',
              headerColor: '#00f2fe',
              rowHoverBg: 'rgba(0, 242, 254, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.05)',
            },
            Modal: {
              contentBg: '#0d1230',
              headerBg: '#0d1230',
            },
            Input: {
              colorBgContainer: 'rgba(255, 255, 255, 0.05)',
              colorBorder: 'rgba(255, 255, 255, 0.15)',
            },
            Select: {
              colorBgContainer: 'rgba(255, 255, 255, 0.05)',
              colorBorder: 'rgba(255, 255, 255, 0.15)',
              optionActiveBg: 'rgba(0, 242, 254, 0.1)',
            },
            Descriptions: {
              labelBg: 'transparent',
            },
          }
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
