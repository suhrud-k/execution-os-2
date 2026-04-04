import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './pages/Layout'
import { TodayPage } from './pages/TodayPage'
import { HistoryPage } from './pages/HistoryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
