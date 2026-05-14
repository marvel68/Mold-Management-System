import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Purchase from './pages/Purchase'
import WorkHours from './pages/WorkHours'
import PartPrices from './pages/PartPrices'
import Molds from './pages/Molds'
import AIAssistant from './pages/AIAssistant'
import WeeklyPivot from './pages/WeeklyPivot'
import Suppliers from './pages/Suppliers'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="purchase" element={<Purchase />} />
        <Route path="work-hours" element={<WorkHours />} />
        <Route path="part-prices" element={<PartPrices />} />
        <Route path="molds" element={<Molds />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="weekly-pivot" element={<WeeklyPivot />} />
        <Route path="suppliers" element={<Suppliers />} />
      </Route>
    </Routes>
  )
}

export default App
