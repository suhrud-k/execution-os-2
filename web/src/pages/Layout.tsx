import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLogStore } from '../store/useLogStore'
import { ActivityLogPanel } from '../components/ActivityLogPanel'
import { isApiConfigured } from '../lib/api'

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const syncWithServer = useLogStore((s) => s.syncWithServer)
  const showActivityDock = location.pathname === '/'
  const onLogTab = location.pathname === '/'
  const navClass = (isActive: boolean, isPending: boolean) =>
    [
      'min-h-12 flex-1 touch-manipulation select-none rounded-xl py-3 text-center text-sm font-semibold transition-all duration-150',
      'active:scale-[0.96] active:bg-slate-700',
      isActive
        ? 'bg-slate-800 text-white ring-2 ring-sky-500/70 ring-offset-2 ring-offset-slate-950'
        : 'text-slate-500 hover:text-slate-300',
      isPending ? 'opacity-70' : '',
    ].join(' ')

  useEffect(() => {
    const onOnline = () => {
      useLogStore.getState().pushActivity(
        'info',
        isApiConfigured()
          ? 'Back online — tap Log (bottom bar) on the daily log screen to upload to the sheet.'
          : 'Back online.',
      )
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-2">
        <Outlet />
      </main>
      {showActivityDock ? (
        <div className="z-[9] shrink-0">
          <ActivityLogPanel variant="docked" />
        </div>
      ) : null}
      <nav className="sticky bottom-0 z-10 flex shrink-0 justify-around gap-1 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur pb-safe">
        <button
          type="button"
          aria-current={onLogTab ? 'page' : undefined}
          aria-label={
            onLogTab
              ? 'Log this day to Google Sheet'
              : 'Open daily log'
          }
          className={[
            'min-h-12 flex-1 touch-manipulation select-none rounded-xl py-3 text-center text-sm font-semibold transition-all duration-150',
            'active:scale-[0.96] active:bg-slate-700',
            onLogTab
              ? 'bg-slate-800 text-white ring-2 ring-sky-500/70 ring-offset-2 ring-offset-slate-950'
              : 'text-slate-500 hover:text-slate-300',
          ].join(' ')}
          onClick={() => {
            if (!onLogTab) {
              navigate('/')
              return
            }
            void syncWithServer()
          }}
        >
          Log
        </button>
        <NavLink to="/history" className={({ isActive, isPending }) => navClass(isActive, isPending)}>
          History
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive, isPending }) => navClass(isActive, isPending)}
        >
          Analytics
        </NavLink>
      </nav>
    </div>
  )
}
