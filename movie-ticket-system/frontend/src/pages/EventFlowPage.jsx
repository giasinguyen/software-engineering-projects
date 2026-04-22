import { useEffect, useState, useCallback } from "react";
import { bookingService, paymentService } from "../services/api";

// ── Exchange routing config ────────────────────────────────────────────────────
const EXCHANGE = {
  name: "movie.ticket.exchange",
  type: "topic",
  bindings: [
    { queue: "payment.queue", routingKey: "booking.created", consumer: "Payment Consumer", color: "#fff" },
    { queue: "notification.queue", routingKey: "payment.completed", consumer: "Notification Consumer", color: "#22c55e" },
    { queue: "— (DLQ behavior)", routingKey: "booking.failed", consumer: "No consumer", color: "#ef4444" },
  ],
};

// ── Animated flow packet ───────────────────────────────────────────────────────
function FlowPacket({ color, delay, duration = 2.2 }) {
  return (
    <div
      className="packet absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-10"
      style={{ background: color, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    />
  );
}

// ── Arrow with animated packets ────────────────────────────────────────────────
function FlowArrow({ routingKey, color = "#fff", active = true }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-w-20 gap-1.5">
      <span className="text-[9px] font-mono font-semibold" style={{ color }}>{routingKey}</span>
      <div className="flex items-center w-full gap-0.5">
        <div className="relative flex-1 h-4 overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: color, opacity: 0.25 }} />
          {active && (
            <>
              <FlowPacket color={color} delay={0} />
              <FlowPacket color={color} delay={0.73} />
              <FlowPacket color={color} delay={1.46} />
            </>
          )}
        </div>
        <svg width="7" height="10" viewBox="0 0 7 10" fill={color} style={{ opacity: 0.6, flexShrink: 0 }}>
          <path d="M0 0L7 5L0 10V0Z" />
        </svg>
      </div>
    </div>
  );
}

// ── Service card ───────────────────────────────────────────────────────────────
function ServiceCard({ role, name, port, lang, events, variant = "default" }) {
  const base = "shrink-0 w-36 rounded-xl border p-3.5";
  const styles = {
    default: `${base} border-[#222] bg-[#111]`,
    broker: `${base} border-[#333] bg-white`,
    success: `${base} border-[#22c55e]/20 bg-[#22c55e]/5`,
    danger: `${base} border-[#ef4444]/20 bg-[#ef4444]/5`,
  };
  const labelColor = { default: "text-[#555]", broker: "text-[#888]", success: "text-[#22c55e]", danger: "text-[#ef4444]" };
  const nameColor = { default: "text-white", broker: "text-black", success: "text-white", danger: "text-white" };
  const metaColor = { default: "text-[#666]", broker: "text-[#888]", success: "text-[#666]", danger: "text-[#666]" };

  return (
    <div className={styles[variant]}>
      <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${labelColor[variant]}`}>{role}</p>
      <p className={`text-sm font-semibold leading-snug ${nameColor[variant]}`}>{name}</p>
      {port && <p className={`text-[10px] font-mono mt-0.5 ${metaColor[variant]}`}>:{port}</p>}
      {lang && <p className={`text-[10px] mt-0.5 ${metaColor[variant]}`}>{lang}</p>}
      {events && events.map((e, i) => (
        <span
          key={i}
          className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: variant === "broker" ? "#f0f0f0" : "#1a1a1a",
            color: variant === "broker" ? "#555" : "#888",
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}

// ── Event log row ──────────────────────────────────────────────────────────────
function EventRow({ event }) {
  const config = {
    "booking.created": { badge: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20", dot: "bg-[#f59e0b]" },
    "payment.completed": { badge: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20", dot: "bg-[#22c55e]" },
    "booking.failed": { badge: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20", dot: "bg-[#ef4444]" },
  }[event.type] || { badge: "text-[#888] bg-[#1a1a1a] border-[#222]", dot: "bg-[#555]" };

  return (
    <tr className="border-t border-[#111] hover:bg-[#111]/50 transition-colors">
      <td className="px-5 py-3.5 text-xs font-mono text-[#555]">#{event.id}</td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${config.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {event.type}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm text-[#a0a0a0] max-w-[220px] truncate">{event.payload}</td>
      <td className="px-5 py-3.5 text-xs text-[#888] font-mono">{event.producer}</td>
      <td className="px-5 py-3.5 text-xs text-[#666]">{event.consumer}</td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function EventFlowPage() {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(() => {
    Promise.allSettled([
      bookingService.getAll(),
      paymentService.getAll(),
    ]).then(([bRes, pRes]) => {
      if (bRes.status === "fulfilled") setBookings(bRes.value.data);
      if (pRes.status === "fulfilled") setPayments(pRes.value.data);
      setLoading(false);
      setLastRefresh(new Date());
    });
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const totalBookings = bookings.length;
  const processed = payments.filter((p) => p.status === "SUCCESS").length;
  const failed = payments.filter((p) => p.status === "FAILED").length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const successRate = payments.length > 0 ? ((processed / payments.length) * 100).toFixed(1) : "—";
  const dlqEvents = payments.filter((p) => p.status === "FAILED");

  const eventLog = [
    ...bookings.map((b) => ({
      id: b.id, type: "booking.created",
      payload: `${b.movieTitle} · Seat ${b.seatNumber}`,
      producer: "Booking Service", consumer: "payment.queue → Payment Consumer",
    })),
    ...payments.map((p) => ({
      id: p.id, type: p.status === "SUCCESS" ? "payment.completed" : "booking.failed",
      payload: p.status === "SUCCESS" ? `TXN: ${p.transactionId} · ${p.method?.replace("_", " ")}` : p.failureReason,
      producer: "Payment Consumer",
      consumer: p.status === "SUCCESS" ? "notification.queue → Notification Consumer" : "DLQ (no consumer)",
    })),
  ].sort((a, b) => b.id - a.id).slice(0, 25);

  const METRICS = [
    { label: "Total Events", value: totalBookings + payments.length, color: "text-white" },
    { label: "Processed", value: processed, color: "text-[#22c55e]" },
    { label: "Failed", value: failed, color: "text-[#ef4444]" },
    { label: "Pending", value: pending, color: "text-[#f59e0b]" },
    { label: "Success Rate", value: `${successRate}%`, color: "text-white" },
  ];

  return (
    <div className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] live-dot inline-block" />
              Live Monitor
            </span>
            <span className="text-xs text-[#555]">Updated {lastRefresh.toLocaleTimeString()} · Refreshes every 5s</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">Event Flow Monitor</h1>
          <p className="text-sm text-[#888] mt-2">Real-time view of the event-driven message pipeline</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-2.5 border border-[#333] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#555] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Architecture Diagram */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-7 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white font-display">System Topology</h2>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#555]">{EXCHANGE.name} · {EXCHANGE.type}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] live-dot inline-block" />
              Streaming
            </span>
          </div>
        </div>

        {/* Flow Row 1 */}
        <div className="mb-3">
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Booking Flow</p>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <ServiceCard role="Producer" name="Booking Service" port="8083" lang="Spring Boot" />
            <FlowArrow routingKey="booking.created" color="#fff" />
            <ServiceCard role="Broker" name="RabbitMQ" events={["payment.queue"]} variant="broker" />
            <FlowArrow routingKey="booking.created" color="#fff" />
            <ServiceCard role="Consumer" name="Payment Consumer" port="3001" lang="Node.js" />
          </div>
        </div>

        <div className="ml-16 my-2 flex items-center gap-2">
          <div className="w-px h-8 bg-[#333]" />
          <span className="text-[10px] text-[#555] font-mono">payment.completed / booking.failed</span>
        </div>

        {/* Flow Row 2 */}
        <div>
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Payment Flow</p>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <ServiceCard role="Producer" name="Payment Consumer" port="3001" lang="Node.js" />
            <FlowArrow routingKey="payment.completed" color="#22c55e" />
            <ServiceCard role="Broker" name="RabbitMQ" events={["notification.queue"]} variant="broker" />
            <FlowArrow routingKey="payment.completed" color="#22c55e" />
            <ServiceCard role="Consumer" name="Notification Consumer" port="3001" lang="Node.js" variant="success" />
            <div className="flex flex-col items-start ml-4 gap-1">
              <div className="flex items-center gap-1.5">
                <svg width="28" height="10" viewBox="0 0 28 10" fill="none">
                  <line x1="0" y1="5" x2="22" y2="5" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
                  <path d="M22 2L28 5L22 8Z" fill="#ef4444" />
                </svg>
                <span className="text-[9px] font-mono text-[#ef4444]">booking.failed</span>
              </div>
              <div className="w-32 border border-[#ef4444]/20 rounded-xl p-2.5 bg-[#ef4444]/5">
                <p className="text-[9px] font-bold text-[#ef4444] uppercase tracking-widest mb-0.5">DLQ</p>
                <p className="text-xs font-semibold text-white">No Consumer</p>
                <p className="text-[10px] text-[#666] mt-0.5">{dlqEvents.length} unhandled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">{m.label}</p>
            <p className={`text-2xl font-bold font-display ${m.color}`}>{loading ? "—" : m.value}</p>
          </div>
        ))}
      </div>

      {/* Exchange Config + DLQ Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#111]">
            <h2 className="text-sm font-semibold text-white font-display">Exchange Bindings</h2>
            <p className="text-xs text-[#555] mt-0.5 font-mono">{EXCHANGE.name}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#111] bg-[#111]/50">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Queue</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Routing Key</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Consumer</th>
              </tr>
            </thead>
            <tbody>
              {EXCHANGE.bindings.map((b, i) => (
                <tr key={i} className="border-t border-[#111] hover:bg-[#111]/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-[#a0a0a0]">{b.queue}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-block font-mono text-xs px-2.5 py-0.5 rounded"
                      style={{ background: `${b.color}14`, color: b.color }}
                    >
                      {b.routingKey}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#888]">{b.consumer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#111]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white font-display">Dead Letter Queue</h2>
                <p className="text-xs text-[#555] mt-0.5">booking.failed — unprocessed messages</p>
              </div>
              {dlqEvents.length > 0 && (
                <span className="text-xs font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-2.5 py-1 rounded-full">
                  {dlqEvents.length} failed
                </span>
              )}
            </div>
          </div>
          <div className="p-5 max-h-[220px] overflow-y-auto">
            {dlqEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-center">
                <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">Queue is empty</p>
                <p className="text-xs text-[#555] mt-0.5">All messages have been consumed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dlqEvents.map((p) => (
                  <div key={p.id} className="flex gap-3 p-3 rounded-lg bg-[#ef4444]/5 border border-[#ef4444]/10">
                    <div className="w-5 h-5 rounded-full bg-[#ef4444]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#ef4444]">booking.failed — Booking #{p.bookingId}</p>
                      <p className="text-xs text-[#ef4444]/70 mt-0.5 truncate">{p.failureReason}</p>
                      <p className="text-[10px] text-[#555] font-mono mt-0.5">{p.movieTitle} · Seat {p.seatNumber}</p>
                    </div>
                    <span className="text-[10px] text-[#555] font-mono shrink-0">retry: 0</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] live-dot" />
            <h2 className="text-sm font-semibold text-white font-display">Event Log</h2>
            <span className="text-xs text-[#555]">All events across the pipeline</span>
          </div>
          <span className="text-xs font-mono text-[#555]">{eventLog.length} events</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-[#555]">Loading event log...</div>
        ) : eventLog.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#555]">No events recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#111] bg-[#111]/30">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">ID</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Event Type</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Payload</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Producer</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-[#555] uppercase tracking-wider">Consumer / Queue</th>
                </tr>
              </thead>
              <tbody>{eventLog.map((ev) => <EventRow key={`${ev.type}-${ev.id}`} event={ev} />)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lifecycle Explainer */}
      <div className="mt-6 rounded-2xl border border-[#1a1a1a] bg-[#111] p-7">
        <h2 className="text-sm font-semibold text-white mb-6 font-display">Event Lifecycle Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { phase: "Publish", event: "booking.created", desc: "Booking Service creates booking record and immediately publishes event to exchange" },
            { phase: "Route", event: "Exchange → Queue", desc: "movie.ticket.exchange routes booking.created to payment.queue via topic binding" },
            { phase: "Consume", event: "payment.queue", desc: "Payment Consumer dequeues message, processes payment synchronously, acks message" },
            { phase: "Emit", event: "payment.completed", desc: "Consumer publishes result event — payment.completed routes to notification.queue" },
          ].map((s, i) => (
            <div key={i} className="border border-[#222] rounded-xl p-5 bg-[#0a0a0a]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs font-semibold text-white">{s.phase}</span>
              </div>
              <p className="text-[11px] font-mono text-[#666] mb-2">{s.event}</p>
              <p className="text-xs text-[#888] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
