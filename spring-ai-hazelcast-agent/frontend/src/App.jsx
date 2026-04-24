import { useState, useCallback, useRef } from 'react'
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
  { id: 'read',     label: 'Read',        icon: '🔍', method: 'GET',    color: 'sky' },
  { id: 'create',   label: 'Create',      icon: '✏️',  method: 'POST',   color: 'emerald' },
  { id: 'update',   label: 'Update',      icon: '🔄',  method: 'PUT',    color: 'amber' },
  { id: 'delete',   label: 'Delete',      icon: '🗑️',  method: 'DELETE', color: 'rose' },
  { id: 'stats',    label: 'Cache Stats', icon: '📊',  method: 'GET',    color: 'violet' },
  { id: 'flush',    label: 'Flush Cache', icon: '🧹',  method: 'DELETE', color: 'orange' },
  { id: 'loadtest', label: 'Load Test',   icon: '🚀', method: 'N×GET',  color: 'fuchsia' },
]

const TAB_ACTIVE = {
  sky:     'bg-sky-500 text-white shadow-sky-200',
  emerald: 'bg-emerald-500 text-white shadow-emerald-200',
  amber:   'bg-amber-500 text-white shadow-amber-200',
  rose:    'bg-rose-500 text-white shadow-rose-200',
  violet:  'bg-violet-500 text-white shadow-violet-200',
  orange:  'bg-orange-500 text-white shadow-orange-200',
  fuchsia: 'bg-fuchsia-500 text-white shadow-fuchsia-200',
}

// ─── LatencyChart ───────────────────────────────────────────────────────────
function LatencyChart({ latencies }) {
  if (!latencies?.length) return null
  const W = 560, H = 110, PX = 6, PY = 10
  const maxV = Math.max(...latencies, 1)
  // Down-sample to at most 500 points for SVG performance
  const sample = latencies.length > 500
    ? latencies.filter((_, i) => i % Math.ceil(latencies.length / 500) === 0)
    : latencies
  const step = (W - PX * 2) / Math.max(sample.length - 1, 1)
  const pts = sample.map((v, i) =>
    `${(PX + i * step).toFixed(1)},${(H - PY - (v / maxV) * (H - PY * 2)).toFixed(1)}`
  ).join(' ')
  // Find where cache kicks in (first cache-latency point = very low)
  const splitIdx = Math.max(1, Math.round(sample.length * 0.005))
  const splitX = (PX + splitIdx * step).toFixed(1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      <defs>
        <linearGradient id="ltGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset={`${(splitIdx / sample.length) * 100}%`} stopColor="#f43f5e" />
          <stop offset={`${(splitIdx / sample.length) * 100 + 2}%`} stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f}
          x1={PX} x2={W - PX}
          y1={H - PY - f * (H - PY * 2)}
          y2={H - PY - f * (H - PY * 2)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}
      <polyline points={pts} fill="none" stroke="url(#ltGrad)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Max label */}
      <text x={PX + 2} y={PY + 8} fill="#f43f5e" fontSize="9" fontFamily="monospace">{maxV.toFixed(1)}ms</text>
      {/* 0 label */}
      <text x={PX + 2} y={H - 2} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">0ms</text>
    </svg>
  )
}

// ─── Histogram ───────────────────────────────────────────────────────────────
function LatencyHistogram({ latencies }) {
  if (!latencies?.length) return null
  const buckets = [
    { label: '0–2ms',   max: 2 },
    { label: '2–5ms',   max: 5 },
    { label: '5–10ms',  max: 10 },
    { label: '10–20ms', max: 20 },
    { label: '20–50ms', max: 50 },
    { label: '50ms+',   max: Infinity },
  ]
  const counts = buckets.map((b, i) => ({
    ...b,
    count: latencies.filter(v => v < b.max && (i === 0 || v >= buckets[i - 1].max)).length,
  }))
  const maxCount = Math.max(...counts.map(c => c.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {counts.map((b, i) => {
        const pct = (b.count / maxCount) * 100
        const color = i < 2 ? 'bg-emerald-500' : i < 4 ? 'bg-amber-500' : 'bg-rose-500'
        return (
          <div key={b.label} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-[9px] font-mono text-gray-400">{b.count > 0 ? b.count : ''}</span>
            <div className="w-full relative" style={{ height: 48 }}>
              <div
                className={`${color} w-full absolute bottom-0 rounded-t transition-all duration-500`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[8px] text-gray-500 text-center leading-tight">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── LoadTestPanel ───────────────────────────────────────────────────────────
function LoadTestPanel() {
  const [testKey, setTestKey] = useState('bench:key1')
  const [count, setCount] = useState(1000)
  const [autoCreate, setAutoCreate] = useState(true)
  const [flushBefore, setFlushBefore] = useState(true)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const abortRef = useRef(false)

  async function runTest() {
    abortRef.current = false
    setRunning(true)
    setProgress(0)
    setResults(null)

    if (flushBefore) {
      try { await apiRequest('DELETE', '/cache/flush') } catch {}
    }
    if (autoCreate) {
      try {
        await apiRequest('POST', '', { key: testKey, data: { benchmark: true, ts: Date.now() } })
      } catch {}
    }

    const latencies = []
    const sources = []
    const startAll = performance.now()

    for (let i = 0; i < count; i++) {
      if (abortRef.current) break
      const t0 = performance.now()
      try {
        const res = await apiRequest('GET', `/${encodeURIComponent(testKey)}`)
        const ms = performance.now() - t0
        latencies.push(ms)
        sources.push(res.data?.source ?? 'unknown')
      } catch {
        latencies.push(0)
        sources.push('error')
      }
      if (i % 50 === 0 || i === count - 1) setProgress(i + 1)
    }

    const totalMs = performance.now() - startAll
    const cacheHits = sources.filter(s => s === 'cache').length
    const dbHits = sources.filter(s => s === 'database').length
    const valid = latencies.filter(v => v > 0)
    const sorted = [...valid].sort((a, b) => a - b)
    const n = sorted.length
    const avg = n ? sorted.reduce((s, v) => s + v, 0) / n : 0

    setResults({
      totalMs: Math.round(totalMs),
      completed: latencies.length,
      throughput: n ? ((n / totalMs) * 1000).toFixed(1) : 0,
      cacheHits, dbHits,
      hitRate: n ? ((cacheHits / n) * 100).toFixed(1) : 0,
      avg: avg.toFixed(2),
      min: n ? sorted[0].toFixed(2) : 0,
      max: n ? sorted[n - 1].toFixed(2) : 0,
      p50: n ? sorted[Math.floor(n * 0.5)].toFixed(2) : 0,
      p95: n ? sorted[Math.floor(n * 0.95)].toFixed(2) : 0,
      p99: n ? sorted[Math.floor(n * 0.99)].toFixed(2) : 0,
      latencies,
    })
    setRunning(false)
  }

  const hitRateNum = results ? parseFloat(results.hitRate) : 0

  return (
    <div className="space-y-5">
      {/* Config */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Key để benchmark</label>
          <input
            type="text" value={testKey} onChange={e => setTestKey(e.target.value)} disabled={running}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Số requests (tối đa 5000)</label>
          <input
            type="number" value={count} min={1} max={5000} disabled={running}
            onChange={e => setCount(Math.max(1, Math.min(5000, parseInt(e.target.value) || 100)))}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
          <input type="checkbox" checked={autoCreate} disabled={running}
            onChange={e => setAutoCreate(e.target.checked)}
            className="accent-fuchsia-500 w-3.5 h-3.5" />
          Tự động tạo key trước khi test
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
          <input type="checkbox" checked={flushBefore} disabled={running}
            onChange={e => setFlushBefore(e.target.checked)}
            className="accent-fuchsia-500 w-3.5 h-3.5" />
          Flush cache trước khi test (để thấy rõ DB→Cache transition)
        </label>
      </div>

      {/* Progress */}
      {(running || (results && results.completed > 0)) && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{running ? '⏳ Đang chạy...' : '✅ Hoàn tất'}</span>
            <span className="font-mono">{progress.toLocaleString()} / {count.toLocaleString()}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-100 ${
                running ? 'bg-fuchsia-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${(progress / count) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={runTest}
          disabled={running || !testKey.trim()}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-fuchsia-500 to-violet-600 hover:from-fuchsia-400 hover:to-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-900/40"
        >
          {running
            ? <><span className="animate-spin">⏳</span> Đang benchmark...</>
            : <><span>🚀</span> Chạy {count.toLocaleString()} Requests</>}
        </button>
        {running && (
          <button
            onClick={() => { abortRef.current = true }}
            className="px-5 py-3 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer"
          >
            ⏹ Dừng
          </button>
        )}
      </div>

      {/* Results */}
      {results && !running && (
        <div className="space-y-4">
          {/* Top 3 KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tổng thời gian', value: `${(results.totalMs / 1000).toFixed(2)}s`, icon: '⏱️', color: 'text-sky-400' },
              { label: 'Throughput', value: `${results.throughput} req/s`, icon: '⚡', color: 'text-amber-400' },
              { label: 'Cache Hit Rate', value: `${results.hitRate}%`, icon: '🎯', color: hitRateNum > 90 ? 'text-emerald-400' : hitRateNum > 50 ? 'text-amber-400' : 'text-rose-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className={`text-base font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Cache vs DB bar */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-violet-400 font-semibold">⚡ Cache: {results.cacheHits.toLocaleString()} hits</span>
              <span className="text-blue-400 font-semibold">🗄️ DB: {results.dbHits.toLocaleString()} hits</span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden bg-blue-900/40 flex">
              <div
                className="bg-gradient-to-r from-fuchsia-500 to-violet-500 h-full transition-all duration-700"
                style={{ width: `${results.hitRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Cache ({results.hitRate}%)</span>
              <span>DB ({(100 - parseFloat(results.hitRate)).toFixed(1)}%)</span>
            </div>
          </div>

          {/* Latency percentiles */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Latency Percentiles</h3>
            <div className="grid grid-cols-6 gap-2">
              {[
                { label: 'Min',  value: results.min },
                { label: 'Avg',  value: results.avg },
                { label: 'p50',  value: results.p50 },
                { label: 'p95',  value: results.p95 },
                { label: 'p99',  value: results.p99 },
                { label: 'Max',  value: results.max },
              ].map(p => {
                const v = parseFloat(p.value)
                const color = v < 5 ? 'text-emerald-400' : v < 20 ? 'text-amber-400' : 'text-rose-400'
                return (
                  <div key={p.label} className="text-center">
                    <div className={`text-sm font-bold font-mono ${color}`}>{p.value}ms</div>
                    <div className="text-[10px] text-gray-500">{p.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Histogram */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Phân phối Latency</h3>
            <LatencyHistogram latencies={results.latencies} />
          </div>

          {/* Timeline chart */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Latency Timeline — {results.completed.toLocaleString()} requests
            </h3>
            <p className="text-[10px] text-gray-500 mb-3">
              <span className="text-rose-400">●</span> Đầu = DB hit (chậm) &nbsp;•&nbsp;
              <span className="text-violet-400">●</span> Sau = Cache hit (nhanh)
            </p>
            <LatencyChart latencies={results.latencies} />
          </div>
        </div>
      )}
    </div>
  )
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

            {activeTab === 'loadtest' ? (
              <LoadTestPanel />
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Response panel — hidden during load test */}
          {activeTab !== 'loadtest' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Response</h2>
            <ResponsePanel result={result} error={error} loading={loading} />
          </div>
          )}

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

