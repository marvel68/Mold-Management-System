import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  AppstoreOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  BankOutlined
} from '@ant-design/icons'
import './Layout.css'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '监控面板' },
  { key: '/purchase', icon: <ShoppingOutlined />, label: '采购管理' },
  { key: '/work-hours', icon: <ClockCircleOutlined />, label: '工时管理' },
  { key: '/part-prices', icon: <DollarOutlined />, label: '标准价查询' },
  { key: '/molds', icon: <AppstoreOutlined />, label: '模具管理' },
  { key: '/weekly-pivot', icon: <BarChartOutlined />, label: '周透视' },
  { key: '/suppliers', icon: <BankOutlined />, label: '供应商管理' },
  { key: '/ai', icon: <RobotOutlined />, label: 'AI助手' }
]

function LayoutComponent() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Layout className="layout-container">
      <div className="particle-bg" />
      
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="sider"
        width={220}
      >
        <div className="logo">
          {!collapsed && (
            <>
              <span className="logo-icon">🏭</span>
              <span className="logo-text">模具管理系统</span>
            </>
          )}
          {collapsed && <span className="logo-icon">🏭</span>}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="menu"
        />
        
        <div 
          className="collapse-trigger"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </Sider>
      
      <Layout>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
