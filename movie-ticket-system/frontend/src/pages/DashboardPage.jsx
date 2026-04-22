import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { movieService, bookingService, paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const FLOW_STEPS = [
  {
    step: "01",
    label: "User Creates Booking",
    desc: "Booking Service persists booking record, publishes booking.created to exchange",
    tag: "PRODUCER",
    tagClass: "bg-neutral-900 text-white",
  },
  {
    step: "02",
    label: "Routed via Message Broker",
    desc: "movie.ticket.exchange (topic) routes booking.created → payment.queue",
    tag: "BROKER",
    tagClass: "bg-neutral-100 text-neutral-600",
  },
  {
    step: "03",
    label: "Payment Consumer Processes",
    desc: "Dequeues booking.created, processes payment, emits payment.completed or booking.failed",
    tag: "CONSUMER",
    tagClass: "bg-neutral-900 text-white",
  },
  {
    step: "04",
    label: "Notification Dispatched",
    desc: "Notification Consumer binds payment.completed, sends booking confirmation",
    tag: "CONSUMER",
    tagClass: "bg-neutral-900 text-white",
  },
];

const SERVICES = [
  { name: "User Service", port: 8081, role: "Auth & user management", lang: "Spring Boot" },
  { name: "Movie Service", port: 8082, role: "Movie catalog & IMDB integration", lang: "Spring Boot" },
  { name: "Booking Service", port: 8083, role: "Booking creation & event publishing", lang: "Spring Boot" },
  { name: "Payment & Notification", port: 3001, role: "Event consumers & payment logic", lang: "Node.js" },
];

function StatCard({ label, value, sub, valueClass }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-3xl font-bold ${valueClass || "text-neutral-900"}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ movies: "—", bookings: "—", payments: "—", successRate: "—" });

  useEffect(() => {
    Promise.allSettled([
      movieService.getAll(),
      bookingService.getAll(),
      paymentService.getAll(),
    ]).then(([mRes, bRes, pRes]) => {
      const movies = mRes.status === "fulfilled" ? mRes.value.data.length : "—";
      const bookings = bRes.status === "fulfilled" ? bRes.value.data.length : "—";
      const payments = pRes.status === "fulfilled" ? pRes.value.data : [];
      const success = payments.filter((p) => p.status === "SUCCESS").length;
      const rate = payments.length > 0 ? Math.round((success / payments.length) * 100) : "—";
      setStats({ movies, bookings, payments: payments.length || "—", successRate: rate });
    });
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot inline-block" />
            System Online
          </span>
          <span className="text-xs text-neutral-400">RabbitMQ · Spring Boot · Node.js</span>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">System Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Event-Driven Movie Ticket Booking — Microservice Architecture
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Movies" value={stats.movies} sub="In catalog" />
        <StatCard label="Total Bookings" value={stats.bookings} sub="Events produced" />
        <StatCard label="Payments" value={stats.payments} sub="Events processed" />
        <StatCard
          label="Success Rate"
          value={typeof stats.successRate === "number" ? `${stats.successRate}%` : "—"}
          sub="Payment success"
          valueClass={
            typeof stats.successRate === "number"
              ? stats.successRate >= 60
                ? "text-emerald-600"
                : "text-red-600"
              : "text-neutral-900"
          }
        />
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Event Lifecycle */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-neutral-900">Event Lifecycle</h2>
            <Link to="/events" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
              Full monitor →
            </Link>
          </div>
          <div className="space-y-5">
            {FLOW_STEPS.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-neutral-300">{s.step}</span>
                  {i < FLOW_STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-neutral-100 mt-1" style={{ minHeight: 16 }} />
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-neutral-900">{s.label}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.tagClass}`}>
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-5">Microservices</h2>
          <div className="space-y-3">
            {SERVICES.map((svc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-100 bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{svc.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{svc.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-semibold text-neutral-700">:{svc.port}</p>
                  <p className="text-[10px] text-neutral-400">{svc.lang}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Banner */}
      <div className="bg-[#0a0a0a] rounded-xl p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">Architecture Pattern</h2>
          <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
            Event-Driven · Async Messaging
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            {
              label: "Producers",
              items: ["Booking Service", "Payment Consumer"],
              note: "Publishes events",
            },
            {
              label: "Broker",
              items: ["RabbitMQ", "movie.ticket.exchange"],
              note: "topic · durable",
            },
            {
              label: "Consumers",
              items: ["Payment Consumer", "Notification Consumer"],
              note: "Subscribes to queues",
            },
          ].map((col, i) => (
            <div key={i} className="border border-white/10 rounded-lg p-4">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3">{col.label}</p>
              <div className="space-y-2 mb-3">
                {col.items.map((item, j) => (
                  <div key={j} className="text-xs bg-white/4 text-neutral-300 font-mono px-2.5 py-2 rounded">
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-600">{col.note}</p>
            </div>
          ))}
        </div>

        {/* Arrow indicators */}
        <div className="grid grid-cols-3 gap-4 mt-2 px-2">
          <div />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-neutral-700">
              <svg width="40" height="10" viewBox="0 0 40 10">
                <line x1="0" y1="5" x2="34" y2="5" stroke="#404040" strokeWidth="1" />
                <path d="M34 2L40 5L34 8Z" fill="#404040" />
              </svg>
              <span className="text-[10px] font-mono text-neutral-700">booking.created</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-neutral-700">
            <svg width="40" height="10" viewBox="0 0 40 10">
              <line x1="0" y1="5" x2="34" y2="5" stroke="#404040" strokeWidth="1" />
              <path d="M34 2L40 5L34 8Z" fill="#404040" />
            </svg>
            <span className="text-[10px] font-mono text-neutral-700">payment.completed</span>
          </div>
        </div>
      </div>

      {/* CTA for guests */}
      {!user && (
        <div className="mt-6 bg-white border border-neutral-200 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-neutral-900">Get started</p>
            <p className="text-sm text-neutral-500 mt-0.5">
              Sign in to browse movies, book tickets, and track your orders
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/register"
              className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
