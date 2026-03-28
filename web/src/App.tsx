import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './pages/Layout'
import { TodayPage } from './pages/TodayPage'
import { HistoryPage } from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
