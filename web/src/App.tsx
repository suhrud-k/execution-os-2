import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './pages/Layout'
import { TodayPage } from './pages/TodayPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="history" element={<Navigate to="/" replace />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
