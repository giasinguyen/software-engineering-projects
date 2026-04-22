import { useEffect, useRef } from "react";

export default function DetailModal({ open, onClose, title, children }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 animate-fade-in" />

      {/* Modal */}
      <div
        ref={contentRef}
        className="relative w-full max-w-lg rounded-2xl border border-[#222] bg-[#0a0a0a] p-0 animate-scale-in overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#1a1a1a]">
          <h2 className="text-lg font-semibold text-white font-display">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable content blocks for inside modals ──────────────────────────────── */
export function ModalSection({ label, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

export function JsonBlock({ data }) {
  return (
    <pre className="bg-[#111] border border-[#222] rounded-lg p-4 text-xs font-mono text-[#a0a0a0] overflow-x-auto leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function RoutingPath({ steps }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((token, i) =>
        token === "→" ? (
          <span key={i} className="text-[#444] text-sm">→</span>
        ) : (
          <span key={i} className="font-mono text-xs bg-[#1a1a1a] text-[#a0a0a0] border border-[#222] px-2 py-1 rounded">
            {token}
          </span>
        )
      )}
    </div>
  );
}
