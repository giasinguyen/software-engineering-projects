import { useState, useCallback } from 'react'
import './App.css'

const BASE_URL = '/api/agent'

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiRequest(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(BASE_URL + path, opts)
  const json = await res.json()
  return { ok: res.ok, status: res.status, data: json }
}

// ─── ArchFlow (static architecture diagram) ──────────────────────────────────
function ArchFlow() {
  const nodes = [
    { label: 'React UI', icon: '⚛️', color: 'from-sky-500 to-sky-600' },
    { label: 'AI Agent Service', icon: '🤖', color: 'from-violet-500 to-violet-600', sub: 'Spring Boot :8080' },
    { label: 'Hazelcast Cache', icon: '⚡', color: 'from-amber-500 to-amber-600', sub: 'Distributed IMap' },
    { label: 'Read / Write Services', icon: '🗄️', color: 'from-emerald-500 to-emerald-600', sub: ':8081 / :8082' },
    { label: 'Database', icon: '💾', color: 'from-rose-500 to-rose-600' },
  ]
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      {nodes.map((n, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={`bg-gradient-to-br ${n.color} text-white rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg min-w-[220px] justify-center`}>
            <span className="text-2xl">{n.icon}</span>
            <div>
              <div className="font-semibold text-sm leading-tight">{n.label}</div>
              {n.sub && <div className="text-xs opacity-80">{n.sub}</div>}
            </div>
          </div>
          {i < nodes.length - 1 && (
            <div className="flex flex-col items-center my-1">
              <div className="w-0.5 h-4 bg-gray-400/60" />
              <div className="text-gray-400 text-sm">↓</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── SourceBadge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  if (!source) return null
  const isCache = source === 'cache'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide
      ${isCache
        ? 'bg-violet-100 text-violet-700 border border-violet-300'
        : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
      {isCache ? '⚡ CACHE HIT' : '🗄️ DATABASE'}
    </span>
  )
}

// ─── LatencyBar ──────────────────────────────────────────────────────────────
function LatencyBar({ ms }) {
  if (ms == null) return null
  const pct = Math.min(100, (ms / 200) * 100)
  const color = ms < 20 ? 'bg-emerald-500' : ms < 80 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-16 shrink-0">Latency</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono font-semibold text-gray-700 w-14 text-right">{ms} ms</span>
    </div>
  )
}

// ─── ResponsePanel ───────────────────────────────────────────────────────────
function ResponsePanel({ result, error, loading }) {
  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400">
      <div className="animate-spin text-3xl mr-3">⏳</div>
      <span className="text-sm">Đang xử lý...</span>
    </div>
  )
  if (error) return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">
      <div className="font-semibold mb-1">❌ Lỗi</div>
      <div>{error}</div>
    </div>
  )
  if (!result) return (
    <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
      Chưa có kết quả — hãy thực hiện một thao tác
    </div>
  )

  const r = result.data
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SourceBadge source={r?.source} />
        <span className={`text-xs font-mono px-2 py-1 rounded-full font-bold
          ${result.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          HTTP {result.status}
        </span>
        {r?.operation && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-mono font-semibold">
            {r.operation}
          </span>
        )}
      </div>

      {r?.latencyMs != null && <LatencyBar ms={r.latencyMs} />}

      {r?.message && (
        <p className="text-sm text-gray-600 italic">{r.message}</p>
      )}

      {r?.data && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Data</div>
          <pre className="bg-gray-900 text-emerald-400 text-xs rounded-xl p-4 overflow-auto max-h-48 font-mono leading-relaxed">
            {JSON.stringify(r.data, null, 2)}
          </pre>
        </div>
      )}

      {r?.errors && (
        <div>
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1">Validation Errors</div>
          <pre className="bg-rose-50 text-rose-700 text-xs rounded-xl p-4 overflow-auto max-h-36 font-mono">
            {JSON.stringify(r.errors, null, 2)}
          </pre>
        </div>
      )}

      {r?.stats && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cache Stats</div>
          <pre className="bg-gray-900 text-sky-400 text-xs rounded-xl p-4 overflow-auto max-h-48 font-mono leading-relaxed">
            {JSON.stringify(r.stats, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── ActivityLog ─────────────────────────────────────────────────────────────
function ActivityLog({ log: entries }) {
  if (!entries.length) return (
    <div className="text-center text-gray-400 text-xs py-6">Chưa có hoạt động nào</div>
  )
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {[...entries].reverse().map((e, i) => (
        <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg
          ${e.ok ? 'bg-gray-50 border border-gray-100' : 'bg-rose-50 border border-rose-100'}`}>
          <span className="font-mono text-gray-400 shrink-0">{e.time}</span>
          <span className={`font-bold shrink-0 uppercase text-[10px] px-1.5 py-0.5 rounded
            ${e.method === 'GET' ? 'bg-sky-100 text-sky-700'
              : e.method === 'POST' ? 'bg-emerald-100 text-emerald-700'
              : e.method === 'PUT' ? 'bg-amber-100 text-amber-700'
              : 'bg-rose-100 text-rose-700'}`}>
            {e.method}
          </span>
          <span className="text-gray-600 font-mono truncate flex-1">{e.path}</span>
          {e.source && <SourceBadge source={e.source} />}
          <span className={`font-mono font-semibold shrink-0 ${e.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {e.status}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'read',   label: 'Read',        icon: '🔍', method: 'GET',    color: 'sky' },
  { id: 'create', label: 'Create',      icon: '✏️',  method: 'POST',   color: 'emerald' },
  { id: 'update', label: 'Update',      icon: '🔄',  method: 'PUT',    color: 'amber' },
  { id: 'delete', label: 'Delete',      icon: '🗑️',  method: 'DELETE', color: 'rose' },
  { id: 'stats',  label: 'Cache Stats', icon: '📊',  method: 'GET',    color: 'violet' },
  { id: 'flush',  label: 'Flush Cache', icon: '🧹',  method: 'DELETE', color: 'orange' },
]

const TAB_ACTIVE = {
  sky:     'bg-sky-500 text-white shadow-sky-200',
  emerald: 'bg-emerald-500 text-white shadow-emerald-200',
  amber:   'bg-amber-500 text-white shadow-amber-200',
  rose:    'bg-rose-500 text-white shadow-rose-200',
  violet:  'bg-violet-500 text-white shadow-violet-200',
  orange:  'bg-orange-500 text-white shadow-orange-200',
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('read')
  const [key, setKey] = useState('')
  const [jsonBody, setJsonBody] = useState('{\n  "name": "Nguyen Van A",\n  "age": 25,\n  "role": "developer"\n}')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activityLog, setActivityLog] = useState([])

  const addLog = useCallback((method, path, status, ok, source) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false })
    setActivityLog(prev => [...prev.slice(-49), { time, method, path, status, ok, source }])
  }, [])

  async function run() {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      let res
      const trimKey = key.trim()
      if (activeTab === 'read') {
        if (!trimKey) { setError('Nhập key để đọc'); setLoading(false); return }
        res = await apiRequest('GET', `/${encodeURIComponent(trimKey)}`)
        addLog('GET', `/${trimKey}`, res.status, res.ok, res.data?.source)
      } else if (activeTab === 'create') {
        if (!trimKey) { setError('Nhập key'); setLoading(false); return }
        let parsed
        try { parsed = JSON.parse(jsonBody) } catch { setError('JSON không hợp lệ'); setLoading(false); return }
        res = await apiRequest('POST', '', { key: trimKey, data: parsed })
        addLog('POST', '/', res.status, res.ok)
      } else if (activeTab === 'update') {
        if (!trimKey) { setError('Nhập key'); setLoading(false); return }
        let parsed
        try { parsed = JSON.parse(jsonBody) } catch { setError('JSON không hợp lệ'); setLoading(false); return }
        res = await apiRequest('PUT', `/${encodeURIComponent(trimKey)}`, parsed)
        addLog('PUT', `/${trimKey}`, res.status, res.ok)
      } else if (activeTab === 'delete') {
        if (!trimKey) { setError('Nhập key để xóa'); setLoading(false); return }
        res = await apiRequest('DELETE', `/${encodeURIComponent(trimKey)}`)
        addLog('DELETE', `/${trimKey}`, res.status, res.ok)
      } else if (activeTab === 'stats') {
        res = await apiRequest('GET', '/cache/stats')
        addLog('GET', '/cache/stats', res.status, res.ok)
      } else if (activeTab === 'flush') {
        res = await apiRequest('DELETE', '/cache/flush')
        addLog('DELETE', '/cache/flush', res.status, res.ok)
      }
      setResult(res)
    } catch (e) {
      setError('Không thể kết nối backend: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const tab = TABS.find(t => t.id === activeTab)
  const needsKey = ['read', 'create', 'update', 'delete'].includes(activeTab)
  const needsBody = ['create', 'update'].includes(activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-xl shadow-lg">
              🤖
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Spring AI · Hazelcast Agent</h1>
              <p className="text-xs text-gray-400">Service-Based Architecture Demo</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Spring Boot', 'Hazelcast', 'React', 'Tailwind'].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-gray-300 font-medium border border-white/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* ── Left column: Architecture ─────────────────────────── */}
        <aside className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Architecture Flow</h2>
            <ArchFlow />
          </div>

          {/* Cache strategy legend */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur text-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Cache Strategy</h2>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-start gap-2"><span className="text-sky-400 shrink-0">🔍 READ</span><span>Cache-Aside (lazy loading)</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✏️ WRITE</span><span>Write-Through (sync DB + cache)</span></li>
              <li className="flex items-start gap-2"><span className="text-rose-400 shrink-0">🗑️ DELETE</span><span>Invalidation (evict from cache)</span></li>
            </ul>
          </div>
        </aside>

        {/* ── Right column: Main panel ──────────────────────────── */}
        <main className="space-y-6">
          {/* Operation card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setResult(null); setError(null) }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                    ${activeTab === t.id
                      ? `${TAB_ACTIVE[t.color]} shadow-lg`
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                >
                  <span>{t.icon}</span> {t.label}
                  <span className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold
                    ${activeTab === t.id ? 'bg-white/20' : 'bg-white/10'}`}>
                    {t.method}
                  </span>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
              {needsKey && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Key
                    <span className="ml-2 font-normal text-gray-500">e.g. user:1001, product:42</span>
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !needsBody && run()}
                    placeholder="user:1001"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
                  />
                </div>
              )}

              {needsBody && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Data <span className="font-normal text-gray-500">(JSON)</span>
                  </label>
                  <textarea
                    value={jsonBody}
                    onChange={e => setJsonBody(e.target.value)}
                    rows={5}
                    spellCheck={false}
                    className="w-full bg-gray-950/80 border border-white/20 rounded-xl px-4 py-3 text-sm text-emerald-400 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono resize-none"
                  />
                </div>
              )}

              {activeTab === 'flush' && (
                <div className="bg-orange-900/30 border border-orange-500/40 rounded-xl p-4 text-sm text-orange-300">
                  ⚠️ Thao tác này sẽ <strong>xóa toàn bộ cache</strong> trong Hazelcast IMap. Dữ liệu trong database không bị ảnh hưởng.
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="bg-violet-900/30 border border-violet-500/40 rounded-xl p-4 text-sm text-violet-300">
                  📊 Lấy thống kê hiện tại của Hazelcast cache (size, hit/miss ratio, memory usage...).
                </div>
              )}
            </div>

            <button
              onClick={run}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer
                ${loading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${
                      tab.color === 'sky'     ? 'from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500'
                    : tab.color === 'emerald' ? 'from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500'
                    : tab.color === 'amber'   ? 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500'
                    : tab.color === 'rose'    ? 'from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500'
                    : tab.color === 'violet'  ? 'from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500'
                    :                          'from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500'
                    } text-white shadow-lg shadow-${tab.color}-900/40`
                }`}
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Đang xử lý...</>
              ) : (
                <><span>{tab.icon}</span> {tab.label} <span className="font-mono text-xs opacity-80">{tab.method}</span></>
              )}
            </button>
          </div>

          {/* Response panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Response</h2>
            <ResponsePanel result={result} error={error} loading={loading} />
          </div>

          {/* Activity log */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Activity Log</h2>
              {activityLog.length > 0 && (
                <button
                  onClick={() => setActivityLog([])}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <ActivityLog log={activityLog} />
          </div>
        </main>
      </div>
    </div>
  )
}

