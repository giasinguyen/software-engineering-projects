import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { movieService, bookingService, paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import DetailModal, { ModalSection, JsonBlock, RoutingPath } from "../components/DetailModal";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    id: "producer",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </svg>
    ),
    title: "Event Producer",
    subtitle: "Booking Service",
    description: "Creates booking records and publishes events to the message exchange. Every user action triggers an async event.",
    detail: {
      payload: { event: "booking.created", data: { bookingId: 42, movieTitle: "Interstellar", seatNumber: 7, userId: 1 }, timestamp: "2026-04-22T12:00:00Z" },
      routing: ["booking.created", "→", "movie.ticket.exchange", "→", "payment.queue"],
    },
  },
  {
    id: "broker",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        <circle cx="8" cy="6" r="1.5" fill="currentColor" />
        <circle cx="16" cy="12" r="1.5" fill="currentColor" />
        <circle cx="10" cy="18" r="1.5" fill="currentColor" />
      </svg>
    ),
    title: "Message Broker",
    subtitle: "RabbitMQ · Topic Exchange",
    description: "Routes events via topic exchange bindings. Decouples producers from consumers for resilient communication.",
    detail: {
      payload: { exchange: "movie.ticket.exchange", type: "topic", durable: true, bindings: ["booking.created → payment.queue", "payment.completed → notification.queue", "booking.failed → DLQ"] },
      routing: ["Exchange", "→", "Routing Key", "→", "Bound Queue"],
    },
  },
  {
    id: "consumer",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      </svg>
    ),
    title: "Event Consumer",
    subtitle: "Payment & Notification",
    description: "Subscribes to queues and processes messages asynchronously. Payment Consumer handles billing; Notification Consumer sends confirmations.",
    detail: {
      payload: { consumer: "Payment Consumer", queue: "payment.queue", action: "Process payment → emit result", output: "payment.completed | booking.failed" },
      routing: ["payment.queue", "→", "Payment Consumer", "→", "payment.completed"],
    },
  },
  {
    id: "retry",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Retry Queue",
    subtitle: "Error Recovery",
    description: "Failed messages are retried with exponential backoff before being moved to the Dead Letter Queue.",
    detail: {
      payload: { mechanism: "Exponential backoff", maxRetries: 3, delays: ["1s", "5s", "30s"], afterMaxRetries: "Move to DLQ" },
      routing: ["Failed Message", "→", "Retry Queue", "→", "Re-process", "→", "DLQ"],
    },
  },
  {
    id: "dlq",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      </svg>
    ),
    title: "Dead Letter Queue",
    subtitle: "Unrecoverable Events",
    description: "Failed events that exceed retry limits are parked here for manual inspection and resolution.",
    detail: {
      payload: { event: "booking.failed", reason: "Insufficient funds", bookingId: 42, retryCount: 3, status: "DEAD" },
      routing: ["booking.failed", "→", "DLQ", "→", "Manual Inspection"],
    },
  },
];

const FLOW_STEPS = [
  { step: "01", title: "User Creates Booking", desc: "Booking Service persists record and publishes booking.created to the exchange.", key: "booking.created", role: "PRODUCER" },
  { step: "02", title: "Exchange Routes Event", desc: "movie.ticket.exchange (topic) routes booking.created → payment.queue via binding.", key: "payment.queue", role: "BROKER" },
  { step: "03", title: "Payment Processing", desc: "Payment Consumer dequeues, processes payment (70% success / 30% fail), acknowledges.", key: "payment.completed", role: "CONSUMER" },
  { step: "04", title: "Result Published", desc: "Consumer emits payment.completed or booking.failed back to the exchange.", key: "booking.failed", role: "PRODUCER" },
  { step: "05", title: "Notification Sent", desc: "Notification Consumer receives payment.completed and logs booking confirmation.", key: "notification.queue", role: "CONSUMER" },
];

const SERVICES = [
  { name: "User Service", port: 8081, role: "Authentication & user management", tech: "Spring Boot", techColor: "#22c55e" },
  { name: "Movie Service", port: 8082, role: "Movie catalog & IMDB integration", tech: "Spring Boot", techColor: "#22c55e" },
  { name: "Booking Service", port: 8083, role: "Booking creation & event publishing", tech: "Spring Boot", techColor: "#22c55e" },
  { name: "Payment & Notification", port: 3001, role: "Event consumers & payment logic", tech: "Node.js", techColor: "#f59e0b" },
];

const TECH_STACK = [
  "RabbitMQ", "Spring Boot", "Node.js", "React", "Vite",
  "MongoDB", "Docker", "REST API", "AMQP", "Microservices",
];

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════════════════════════════════════ */

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "" }) {
  const ref = useReveal();
  return <section ref={ref} className={`reveal ${className}`}>{children}</section>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED FLOW PACKET (hero decoration)
   ═══════════════════════════════════════════════════════════════════════════ */

function HeroFlowLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Horizontal lines with packets */}
      {[
        { top: "25%", delay: 0, color: "#333" },
        { top: "50%", delay: 0.8, color: "#444" },
        { top: "75%", delay: 1.6, color: "#333" },
      ].map((line, i) => (
        <div key={i} className="absolute left-0 right-0 h-px" style={{ top: line.top, background: line.color, opacity: 0.3 }}>
          <div
            className="packet absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: "#fff", animationDuration: "4s", animationDelay: `${line.delay}s`, opacity: 0.15 }}
          />
          <div
            className="packet absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: "#fff", animationDuration: "4s", animationDelay: `${line.delay + 2}s`, opacity: 0.15 }}
          />
        </div>
      ))}

      {/* Grid dots */}
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, #333 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        opacity: 0.3,
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { user } = useAuth();
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState({ movies: "—", bookings: "—", payments: "—", successRate: "—", pending: "—", failed: "—" });
  const [eventLog, setEventLog] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchLiveData = useCallback(() => {
    Promise.allSettled([
      movieService.getAll(),
      bookingService.getAll(),
      paymentService.getAll(),
    ]).then(([mRes, bRes, pRes]) => {
      const movies = mRes.status === "fulfilled" ? mRes.value.data : [];
      const bookings = bRes.status === "fulfilled" ? bRes.value.data : [];
      const payments = pRes.status === "fulfilled" ? pRes.value.data : [];

      const success = payments.filter((p) => p.status === "SUCCESS").length;
      const failed = payments.filter((p) => p.status === "FAILED").length;
      const pending = bookings.filter((b) => b.status === "PENDING").length;
      const rate = payments.length > 0 ? Math.round((success / payments.length) * 100) : "—";

      setStats({
        movies: movies.length || "—",
        bookings: bookings.length || "—",
        payments: payments.length || "—",
        successRate: rate,
        pending,
        failed,
      });

      const log = [
        ...bookings.map((b) => ({
          id: b.id, type: "booking.created",
          payload: `${b.movieTitle} · Seat ${b.seatNumber}`,
          time: "→ payment.queue",
        })),
        ...payments.map((p) => ({
          id: p.id + 10000,
          type: p.status === "SUCCESS" ? "payment.completed" : "booking.failed",
          payload: p.status === "SUCCESS" ? `TXN: ${p.transactionId}` : p.failureReason,
          time: p.status === "SUCCESS" ? "→ notification.queue" : "→ DLQ",
        })),
      ].sort((a, b) => b.id - a.id).slice(0, 8);

      setEventLog(log);
      setLastRefresh(new Date());
    });
  }, []);

  useEffect(() => {
    fetchLiveData();
    const iv = setInterval(fetchLiveData, 5000);
    return () => clearInterval(iv);
  }, [fetchLiveData]);

  return (
    <div className="bg-black text-white">

      {/* ═══════════════ SECTION 1: HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroFlowLine />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-32">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 border border-[#333] rounded-full px-4 py-1.5 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] live-dot" />
            <span className="text-xs text-[#a0a0a0] tracking-wider uppercase">Live System · RabbitMQ · Microservices</span>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] mb-6 animate-fade-in-up">
            EVENT-DRIVEN
            <br />
            <span className="text-[#666]">ARCHITECTURE</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#888] max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up stagger-2">
            A cinematic exploration of asynchronous message queues.
            Watch events flow from Producer through Broker to Consumer — in real time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
            <Link
              to="/events"
              className="px-8 py-3.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] transition-colors cursor-pointer"
            >
              Explore Events
            </Link>
            <Link
              to="/movies"
              className="px-8 py-3.5 border border-[#333] text-white text-sm font-medium rounded-lg hover:border-[#555] hover:bg-[#111] transition-colors cursor-pointer"
            >
              Browse Movies
            </Link>
            {!user && (
              <Link
                to="/register"
                className="px-8 py-3.5 text-[#888] text-sm hover:text-white transition-colors cursor-pointer"
              >
                Start Demo →
              </Link>
            )}
          </div>

          {/* Mini architecture diagram */}
          <div className="mt-16 flex items-center justify-center gap-3 text-[11px] font-mono text-[#555] animate-fade-in stagger-5">
            <span className="border border-[#333] px-3 py-1.5 rounded">Producer</span>
            <svg width="24" height="8" viewBox="0 0 24 8" fill="none"><line x1="0" y1="4" x2="18" y2="4" stroke="#444" strokeWidth="1"/><path d="M18 1l4 3-4 3" fill="#444"/></svg>
            <span className="border border-[#333] px-3 py-1.5 rounded bg-[#111]">Broker</span>
            <svg width="24" height="8" viewBox="0 0 24 8" fill="none"><line x1="0" y1="4" x2="18" y2="4" stroke="#444" strokeWidth="1"/><path d="M18 1l4 3-4 3" fill="#444"/></svg>
            <span className="border border-[#333] px-3 py-1.5 rounded">Consumer</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in stagger-6">
          <span className="text-[10px] text-[#555] uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 border border-[#333] rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-[#555] rounded-full animate-float" />
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 2: FEATURED CARDS ═══════════════ */}
      <RevealSection className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-[#555] uppercase tracking-[0.2em] mb-3">The Architecture</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Every component <span className="text-[#666]">has a role</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setModal(feature)}
                className="group text-left p-7 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#333] hover:bg-[#111] transition-all duration-300 cursor-pointer"
              >
                <div className="text-[#555] group-hover:text-white transition-colors mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 font-display">{feature.title}</h3>
                <p className="text-xs text-[#555] font-mono mb-3">{feature.subtitle}</p>
                <p className="text-sm text-[#888] leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#555] group-hover:text-[#888] transition-colors">
                  <span>View details</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════ SECTION 3: EVENT FLOW SHOWCASE ═══════════════ */}
      <RevealSection className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-[#555] uppercase tracking-[0.2em] mb-3">The Journey</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Life of <span className="text-[#666]">an event</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-12 left-[40px] right-[40px] h-px bg-[#222]" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {FLOW_STEPS.map((step, i) => (
                <div key={step.step} className="relative text-center lg:text-center">
                  {/* Step number */}
                  <div className="relative z-10 w-10 h-10 rounded-full border-2 border-[#333] bg-black flex items-center justify-center mx-auto mb-5">
                    <span className="text-xs font-bold text-white">{step.step}</span>
                  </div>

                  {/* Card */}
                  <div className="p-5 rounded-xl border border-[#1a1a1a] bg-[#111]">
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        step.role === "PRODUCER" ? "bg-white/10 text-white" :
                        step.role === "BROKER" ? "bg-[#222] text-[#888]" :
                        "bg-white/5 text-[#888]"
                      }`}>
                        {step.role}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed mb-3">{step.desc}</p>
                    <span className="inline-block font-mono text-[10px] bg-[#1a1a1a] text-[#888] border border-[#222] px-2 py-1 rounded">
                      {step.key}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════ SECTION 4: LIVE MONITORING ═══════════════ */}
      <RevealSection className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] live-dot" />
                  LIVE
                </span>
                <span className="text-xs text-[#555]">Updated {lastRefresh.toLocaleTimeString()}</span>
              </div>
              <p className="text-[11px] font-bold text-[#555] uppercase tracking-[0.2em] mb-3">Now Showing</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
                System <span className="text-[#666]">metrics</span>
              </h2>
            </div>
            <button
              onClick={fetchLiveData}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#333] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#555] transition-colors cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {[
              { label: "Movies", value: stats.movies, color: "text-white" },
              { label: "Bookings", value: stats.bookings, color: "text-white" },
              { label: "Payments", value: stats.payments, color: "text-white" },
              { label: "Success Rate", value: typeof stats.successRate === "number" ? `${stats.successRate}%` : "—", color: typeof stats.successRate === "number" && stats.successRate >= 60 ? "text-[#22c55e]" : "text-[#ef4444]" },
              { label: "Pending", value: stats.pending, color: "text-[#f59e0b]" },
              { label: "Failed", value: stats.failed, color: "text-[#ef4444]" },
            ].map((m) => (
              <div key={m.label} className="p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
                <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">{m.label}</p>
                <p className={`text-2xl md:text-3xl font-bold font-display ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Live event feed */}
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] live-dot" />
                <h3 className="text-sm font-semibold text-white">Event Feed</h3>
              </div>
              <span className="text-xs font-mono text-[#555]">{eventLog.length} events</span>
            </div>
            <div className="divide-y divide-[#111]">
              {eventLog.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-[#555]">No events recorded yet — start by booking a ticket</div>
              ) : (
                eventLog.map((ev) => {
                  const typeColor =
                    ev.type === "booking.created" ? "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20" :
                    ev.type === "payment.completed" ? "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20" :
                    "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20";
                  return (
                    <div key={ev.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-[#111] transition-colors">
                      <span className={`inline-flex items-center text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${typeColor}`}>
                        {ev.type}
                      </span>
                      <span className="text-sm text-[#a0a0a0] flex-1 truncate">{ev.payload}</span>
                      <span className="text-xs font-mono text-[#444] shrink-0">{ev.time}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════ SECTION 5: MICROSERVICES "THE CAST" ═══════════════ */}
      <RevealSection className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-[#555] uppercase tracking-[0.2em] mb-3">The Cast</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Microservices <span className="text-[#666]">ensemble</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="group p-6 rounded-2xl border border-[#1a1a1a] bg-[#111] hover:border-[#333] transition-all duration-300"
              >
                {/* Status dot */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] live-dot" />
                  <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Online</span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 font-display">{svc.name}</h3>
                <p className="text-sm text-[#888] leading-relaxed mb-4">{svc.role}</p>

                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
                    style={{ color: svc.techColor, borderColor: `${svc.techColor}33`, backgroundColor: `${svc.techColor}11` }}
                  >
                    {svc.tech}
                  </span>
                  <span className="text-xs font-mono text-[#555]">:{svc.port}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════ SECTION 6: FOOTER ═══════════════ */}
      <footer className="py-20 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          {/* Tech stack */}
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold text-[#555] uppercase tracking-[0.2em] mb-6">Powered By</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="text-xs font-mono text-[#666] border border-[#222] px-4 py-2 rounded-full hover:text-white hover:border-[#444] transition-colors cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[#111] gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
                </svg>
              </div>
              <span className="text-sm text-[#555]">MovieTix · Event-Driven Architecture Demo</span>
            </div>
            <p className="text-xs text-[#444]">
              Software Architecture · 2026
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════ DETAIL MODAL ═══════════════ */}
      <DetailModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title || ""}
      >
        {modal && (
          <>
            <ModalSection label="Description">
              <p className="text-sm text-[#a0a0a0] leading-relaxed">{modal.description}</p>
            </ModalSection>
            <ModalSection label="Event Payload">
              <JsonBlock data={modal.detail.payload} />
            </ModalSection>
            <ModalSection label="Routing Path">
              <RoutingPath steps={modal.detail.routing} />
            </ModalSection>
          </>
        )}
      </DetailModal>
    </div>
  );
}
