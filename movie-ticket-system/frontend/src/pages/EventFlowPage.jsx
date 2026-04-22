import { useEffect, useState, useCallback } from "react";
import { bookingService, paymentService } from "../services/api";

// ── Exchange routing config (reflects actual backend) ─────────────────────────
const EXCHANGE = {
  name: "movie.ticket.exchange",
  type: "topic",
  bindings: [
    {
      queue: "payment.queue",
      routingKey: "booking.created",
      consumer: "Payment Consumer",
      color: "#0a0a0a",
    },
    {
      queue: "notification.queue",
      routingKey: "payment.completed",
      consumer: "Notification Consumer",
      color: "#059669",
    },
    {
      queue: "— (DLQ behavior)",
      routingKey: "booking.failed",
      consumer: "No consumer",
      color: "#dc2626",
    },
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
function FlowArrow({ routingKey, color = "#0a0a0a", active = true }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-w-20 gap-1.5">
      <span className="text-[9px] font-mono font-semibold" style={{ color }}>
        {routingKey}
      </span>
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
  const base = "shrink-0 w-36 rounded-lg border p-3.5";
  const styles = {
    default: `${base} border-neutral-200 bg-neutral-50`,
    broker: `${base} border-neutral-900 bg-neutral-900`,
    success: `${base} border-emerald-200 bg-emerald-50`,
    danger: `${base} border-red-200 bg-red-50`,
  };
  const labelColor = {
    default: "text-neutral-400",
    broker: "text-neutral-500",
    success: "text-emerald-500",
    danger: "text-red-500",
  };
  const nameColor = {
    default: "text-neutral-900",
    broker: "text-white",
    success: "text-neutral-900",
    danger: "text-neutral-900",
  };
  const metaColor = {
    default: "text-neutral-500",
    broker: "text-neutral-500",
    success: "text-neutral-500",
    danger: "text-neutral-500",
  };

  return (
    <div className={styles[variant]}>
      <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${labelColor[variant]}`}>{role}</p>
      <p className={`text-sm font-semibold leading-snug ${nameColor[variant]}`}>{name}</p>
      {port && (
        <p className={`text-[10px] font-mono mt-0.5 ${metaColor[variant]}`}>:{port}</p>
      )}
      {lang && (
        <p className={`text-[10px] mt-0.5 ${metaColor[variant]}`}>{lang}</p>
      )}
      {events && events.map((e, i) => (
        <span
          key={i}
          className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: variant === "broker" ? "rgba(255,255,255,0.08)" : "#f5f5f5", color: variant === "broker" ? "#a3a3a3" : "#525252" }}
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
    "booking.created": {
      badge: "text-amber-700 bg-amber-50 border-amber-200",
      dot: "bg-amber-500",
    },
    "payment.completed": {
      badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
      dot: "bg-emerald-500",
    },
    "booking.failed": {
      badge: "text-red-700 bg-red-50 border-red-200",
      dot: "bg-red-500",
    },
  }[event.type] || { badge: "text-neutral-700 bg-neutral-50 border-neutral-200", dot: "bg-neutral-400" };

  return (
    <tr className="border-t border-neutral-100 hover:bg-neutral-50/70 transition-colors">
      <td className="px-5 py-3 text-xs font-mono text-neutral-400">#{event.id}</td>
      <td className="px-5 py-3">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {event.type}
        </span>
      </td>
      <td className="px-5 py-3 text-sm text-neutral-700 max-w-[220px] truncate">{event.payload}</td>
      <td className="px-5 py-3 text-xs text-neutral-500 font-mono">{event.producer}</td>
      <td className="px-5 py-3 text-xs text-neutral-400">{event.consumer}</td>
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

  // Metrics
  const totalBookings = bookings.length;
  const processed = payments.filter((p) => p.status === "SUCCESS").length;
  const failed = payments.filter((p) => p.status === "FAILED").length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const successRate = payments.length > 0 ? ((processed / payments.length) * 100).toFixed(1) : "—";
  const dlqEvents = payments.filter((p) => p.status === "FAILED");

  // Build event log
  const eventLog = [
    ...bookings.map((b) => ({
      id: b.id,
      type: "booking.created",
      payload: `${b.movieTitle} · Seat ${b.seatNumber}`,
      producer: "Booking Service",
      consumer: "payment.queue → Payment Consumer",
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: p.status === "SUCCESS" ? "payment.completed" : "booking.failed",
      payload:
        p.status === "SUCCESS"
          ? `TXN: ${p.transactionId} · ${p.method?.replace("_", " ")}`
          : p.failureReason,
      producer: "Payment Consumer",
      consumer:
        p.status === "SUCCESS"
          ? "notification.queue → Notification Consumer"
          : "DLQ (no consumer)",
    })),
  ]
    .sort((a, b) => b.id - a.id)
    .slice(0, 25);

  const METRICS = [
    { label: "Total Events", value: totalBookings + payments.length, color: "text-neutral-900" },
    { label: "Processed", value: processed, color: "text-emerald-600" },
    { label: "Failed", value: failed, color: "text-red-600" },
    { label: "Pending", value: pending, color: "text-amber-600" },
    { label: "Success Rate", value: `${successRate}%`, color: "text-neutral-900" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot inline-block" />
              Live Monitor
            </span>
            <span className="text-xs text-neutral-400">
              Updated {lastRefresh.toLocaleTimeString()} · Refreshes every 5s
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Event Flow Monitor</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time view of the event-driven message pipeline
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-200 bg-white rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Architecture Diagram ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 p-7 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-neutral-900">System Topology</h2>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400">
              {EXCHANGE.name} · {EXCHANGE.type}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 live-dot inline-block" />
              Streaming
            </span>
          </div>
        </div>

        {/* Flow Row 1: booking.created */}
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">
            Booking Flow
          </p>
          <div className="flex items-center gap-3">
            <ServiceCard role="Producer" name="Booking Service" port="8083" lang="Spring Boot" />
            <FlowArrow routingKey="booking.created" color="#0a0a0a" />
            <ServiceCard role="Broker" name="RabbitMQ" events={["payment.queue"]} variant="broker" />
            <FlowArrow routingKey="booking.created" color="#0a0a0a" />
            <ServiceCard role="Consumer" name="Payment Consumer" port="3001" lang="Node.js" />
          </div>
        </div>

        {/* Vertical connector */}
        <div className="ml-50 my-1 flex items-center gap-2">
          <div className="w-px h-8 bg-neutral-200" />
          <span className="text-[10px] text-neutral-400 font-mono">payment.completed / booking.failed</span>
        </div>

        {/* Flow Row 2: payment.completed */}
        <div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">
            Payment Flow
          </p>
          <div className="flex items-center gap-3">
            <ServiceCard role="Producer" name="Payment Consumer" port="3001" lang="Node.js" />
            <FlowArrow routingKey="payment.completed" color="#059669" />
            <ServiceCard role="Broker" name="RabbitMQ" events={["notification.queue"]} variant="broker" />
            <FlowArrow routingKey="payment.completed" color="#059669" />
            <ServiceCard role="Consumer" name="Notification Consumer" port="3001" lang="Node.js" variant="success" />

            {/* DLQ branch */}
            <div className="flex flex-col items-start ml-4 gap-1">
              <div className="flex items-center gap-1.5">
                <svg width="28" height="10" viewBox="0 0 28 10" fill="none">
                  <line x1="0" y1="5" x2="22" y2="5" stroke="#dc2626" strokeWidth="1" strokeDasharray="3 2" />
                  <path d="M22 2L28 5L22 8Z" fill="#dc2626" />
                </svg>
                <span className="text-[9px] font-mono text-red-500">booking.failed</span>
              </div>
              <div className="w-32 border border-red-200 rounded-lg p-2.5 bg-red-50">
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-0.5">DLQ</p>
                <p className="text-xs font-semibold text-neutral-900">No Consumer</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  {dlqEvents.length} unhandled event{dlqEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Metrics ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-neutral-200 p-5">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{loading ? "—" : m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Exchange Config + DLQ Panel ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Exchange routing table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Exchange Bindings</h2>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">{EXCHANGE.name}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Queue</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Routing Key</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Consumer</th>
              </tr>
            </thead>
            <tbody>
              {EXCHANGE.bindings.map((b, i) => (
                <tr key={i} className="border-t border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-neutral-700">{b.queue}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-block font-mono text-xs px-2 py-0.5 rounded"
                      style={{ background: `${b.color}14`, color: b.color }}
                    >
                      {b.routingKey}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-neutral-600">{b.consumer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DLQ Panel */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Dead Letter Queue</h2>
                <p className="text-xs text-neutral-400 mt-0.5">booking.failed — unprocessed messages</p>
              </div>
              {dlqEvents.length > 0 && (
                <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  {dlqEvents.length} failed
                </span>
              )}
            </div>
          </div>
          <div className="p-5 max-h-[220px] overflow-y-auto">
            {dlqEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-700">Queue is empty</p>
                <p className="text-xs text-neutral-400 mt-0.5">All messages have been consumed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dlqEvents.map((p) => (
                  <div key={p.id} className="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-red-800">
                        booking.failed — Booking #{p.bookingId}
                      </p>
                      <p className="text-xs text-red-600 mt-0.5 truncate">{p.failureReason}</p>
                      <p className="text-[10px] text-red-400 font-mono mt-0.5">
                        {p.movieTitle} · Seat {p.seatNumber}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[10px] text-red-400 font-mono">retry: 0</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Log ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Event Log</h2>
            <p className="text-xs text-neutral-400 mt-0.5">All events across the message pipeline</p>
          </div>
          <span className="text-xs font-mono text-neutral-400">{eventLog.length} events</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-400">Loading event log...</div>
        ) : eventLog.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-400">No events recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">ID</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Event Type</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Payload</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Producer</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Consumer / Queue</th>
                </tr>
              </thead>
              <tbody>
                {eventLog.map((ev) => (
                  <EventRow key={`${ev.type}-${ev.id}`} event={ev} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Event Lifecycle Explainer ─────────────────────────────────────────── */}
      <div className="mt-6 bg-[#0a0a0a] rounded-xl p-7">
        <h2 className="text-sm font-semibold text-white mb-5">Event Lifecycle Explained</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              phase: "Publish",
              event: "booking.created",
              desc: "Booking Service creates booking record and immediately publishes event to exchange",
              color: "#a3a3a3",
            },
            {
              phase: "Route",
              event: "Exchange → Queue",
              desc: "movie.ticket.exchange routes booking.created to payment.queue via topic binding",
              color: "#a3a3a3",
            },
            {
              phase: "Consume",
              event: "payment.queue",
              desc: "Payment Consumer dequeues message, processes payment synchronously, acks message",
              color: "#a3a3a3",
            },
            {
              phase: "Emit",
              event: "payment.completed",
              desc: "Consumer publishes result event — payment.completed routes to notification.queue",
              color: "#059669",
            },
          ].map((s, i) => (
            <div key={i} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-semibold text-white">{s.phase}</span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400 mb-2">{s.event}</p>
              <p className="text-xs text-neutral-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
