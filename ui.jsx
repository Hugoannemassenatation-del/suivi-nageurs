import React from "react";
import { X, AlertCircle } from "lucide-react";

export function ViewHeader({ eyebrow, title, action }) {
  return (
    <div className="view-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="empty">
      <AlertCircle size={16} />
      <span>{text}</span>
    </div>
  );
}

export function StatTile({ label, value, unit, accent }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: "var(--chrono)" } : undefined}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={"modal" + (wide ? " fiche-modal" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
