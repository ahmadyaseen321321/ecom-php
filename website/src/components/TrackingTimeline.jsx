import React, { useState } from 'react';
import { Package, MapPin, Clock, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import './TrackingTimeline.css';

export const STAGES = [
  { key: 'ordered', label: 'Ordered', match: null }, // always done once visible
  { key: 'booked', label: 'Booked', match: /BOOK|CREATE/i },
  { key: 'transit', label: 'In Transit', match: /TRANSIT|PICK|PICKUP|IN TRANS/i },
  { key: 'ofd', label: 'Out for Delivery', match: /OUT FOR|OFD|OUTFOR/i },
  { key: 'delivered', label: 'Delivered', match: /DELIVER/i },
];

// Highest stage index reached by the checkpoint list
export function currentStage(events = []) {
  let stage = 0;
  for (const ev of events) {
    const hay = `${ev.status_text || ''} ${ev.status_code || ''}`;
    STAGES.forEach((s, i) => {
      if (s.match && s.match.test(hay)) stage = Math.max(stage, i);
    });
  }
  return stage;
}

function fmtDate(value) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * TCS tracking timeline — shared by the seller dashboard and customer orders.
 *
 * Props:
 *   tracking: { tcs_cn, tcs_status, order_status, mode, events: [...] } | null
 *   loading:  bool
 *   onRefresh: async () => {}   optional "refresh" button handler
 *   notShippedText: string      shown when the order has no CN yet
 */
export default function TrackingTimeline({ tracking, loading, onRefresh, notShippedText }) {
  const [refreshing, setRefreshing] = useState(false);

  const cn = tracking?.tcs_cn;
  const events = tracking?.events || [];
  const stage = currentStage(events);
  const isDemo = tracking?.mode === 'demo';

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !tracking) {
    return (
      <div className="ttl-loading">
        <RefreshCw size={16} className="spin" />
        Loading tracking…
      </div>
    );
  }

  if (!cn) {
    return (
      <div className="ttl-empty">
        <Truck size={18} />
        <span>{notShippedText || 'Not shipped yet — tracking appears once the seller books the parcel with TCS.'}</span>
      </div>
    );
  }

  return (
    <div className="ttl">
      {/* Header: CN + status + refresh */}
      <div className="ttl-header">
        <div className="ttl-header-left">
          <span className="ttl-carrier">
            <Package size={14} /> TCS Courier
          </span>
          <span className="ttl-cn" title="TCS consignment number (CN)">
            {cn}
          </span>
          {isDemo && (
            <span className="ttl-demo-badge" title="Demo mode — no live TCS credentials configured yet">
              DEMO
            </span>
          )}
        </div>
        {onRefresh && (
          <button className="ttl-refresh" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Stage strip */}
      <div className="ttl-stages">
        {STAGES.map((s, i) => {
          const done = i <= stage;
          const isCurrent = i === stage && stage < STAGES.length - 1;
          return (
            <div
              key={s.key}
              className={`ttl-stage ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="ttl-stage-node">{done ? '✓' : i + 1}</div>
              <span className="ttl-stage-label">{s.label}</span>
              {i < STAGES.length - 1 && <div className={`ttl-stage-bar ${i < stage ? 'filled' : ''}`} />}
            </div>
          );
        })}
      </div>

      {/* Current status banner */}
      <div className={`ttl-status-banner ${stage >= STAGES.length - 1 ? 'delivered' : ''}`}>
        <ShieldCheck size={15} />
        <div>
          <strong>{tracking?.tcs_status || 'Booked with TCS'}</strong>
          {tracking?.cod_amount > 0 && (
            <span className="ttl-cod">
              COD Rs. {Number(tracking.cod_amount).toLocaleString()} —{' '}
              {tracking.cod_paid === 'paid' ? 'Collected' : 'Pay on delivery'}
            </span>
          )}
        </div>
      </div>

      {/* Checkpoint list */}
      {events.length > 0 ? (
        <ol className="ttl-events">
          {events.map((ev, i) => (
            <li key={`${ev.status_text}-${ev.checkpoint_at || i}`} className={i === 0 ? 'latest' : ''}>
              <div className="ttl-event-dot" />
              <div className="ttl-event-body">
                <span className="ttl-event-title">{ev.status_text}</span>
                <span className="ttl-event-meta">
                  {ev.location ? (
                    <span className="ttl-event-loc">
                      <MapPin size={11} /> {ev.location}
                    </span>
                  ) : null}
                  <span className="ttl-event-date">
                    <Clock size={11} /> {fmtDate(ev.checkpoint_at)}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="ttl-noevents">No checkpoints yet — booked and waiting for pickup scan.</div>
      )}
    </div>
  );
}
