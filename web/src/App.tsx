import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BreathingLoadScreen } from './components/BreathingLoadScreen'
import { Layout } from './pages/Layout'
import { TodayPage } from './pages/TodayPage'

const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={<BreathingLoadScreen detail="Loading…" />}
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TodayPage />} />
            <Route path="history" element={<Navigate to="/" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
