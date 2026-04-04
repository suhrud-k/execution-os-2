/** Wordmark: sky accent + white on the app’s dark slate theme (matches nav rings / links). */
export function AppLogo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`select-none text-center font-bold tracking-tight ${className}`}
      role="img"
      aria-label="XOS"
    >
      <span className="text-sky-400">X</span>
      <span className="text-white">OS</span>
    </div>
  )
}
