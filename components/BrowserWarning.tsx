export function BrowserWarning() {
  return (
    <div
      role="alert"
      className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-yellow-800 text-sm"
    >
      Your browser does not support voice input. Please use{' '}
      <strong>Chrome or Edge</strong> to use this app.
    </div>
  )
}
