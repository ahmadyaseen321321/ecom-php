import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import {
  Printer,
  FileText,
  Truck,
  Search,
  Loader2,
  RefreshCw,
  PackageCheck,
  MapPin,
  BadgeIndianRupee,
} from 'lucide-react';
import {
  tcsFetchShipmentsApi,
  tcsShipApi,
  tcsTrackApi,
  tcsRefreshAllApi,
  openTcsLabelApi,
  downloadInvoiceApi,
} from '../services/api';
import TrackingTimeline from './TrackingTimeline';
import './SellerShipmentPage.css';

function fmtMoney(v) {
  return `Rs. ${Number(v || 0).toLocaleString()}`;
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SellerShipmentPage() {
  const { showToast } = useCart();

  const [data, setData] = useState({ mode: 'demo', pending_orders: [], shipments: [] });
  const [loading, setLoading] = useState(true);
  const [shippingId, setShippingId] = useState(null);   // order being booked now
  const [openTrackId, setOpenTrackId] = useState(null); // shipment with expanded timeline
  const [trackData, setTrackData] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await tcsFetchShipmentsApi();
    if (res) setData(res);
    else if (!silent) showToast('Could not load shipments', 'error');
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Demo mode: checkpoints advance with time — poll so the dashboard stays live.
  useEffect(() => {
    if (data.mode !== 'demo') return undefined;
    const t = setInterval(() => tcsRefreshAllApi().then(() => load(true)).catch(() => {}), 60000);
    return () => clearInterval(t);
  }, [data.mode, load]);

  const handleShip = async (orderId) => {
    setShippingId(orderId);
    try {
      const res = await tcsShipApi(orderId);
      if (res?.tcs_cn) {
        showToast(`Booked with TCS — CN: ${res.tcs_cn}`);
        await load(true);
      } else {
        showToast('Booking failed — see console', 'error');
        console.error('TCS ship failed:', res);
      }
    } finally {
      setShippingId(null);
    }
  };

  const handleTrack = async (shipment) => {
    const id = shipment.id;
    if (openTrackId === id) {
      setOpenTrackId(null);
      setTrackData(null);
      return;
    }
    setOpenTrackId(id);
    setTrackLoading(true);
    const res = await tcsTrackApi(id); // refreshes server-side, returns timeline
    setTrackData(res);
    setTrackLoading(false);
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    const res = await tcsRefreshAllApi();
    if (res) {
      showToast(`Tracking refreshed (${res.refreshed} shipment${res.refreshed === 1 ? '' : 's'})`);
      await load(true);
      // keep an open timeline in sync too
      if (openTrackId) {
        const t = await tcsTrackApi(openTrackId);
        setTrackData(t);
      }
    }
    setRefreshing(false);
  };

  const handleLabel = async (orderId) => {
    try {
      await openTcsLabelApi(orderId);
      showToast('TCS label downloaded — open the PDF to print');
    } catch (e) {
      showToast(e.message || 'Label failed', 'error');
    }
  };

  const handleInvoice = async (orderId) => {
    try {
      await downloadInvoiceApi(orderId);
      showToast('Invoice PDF downloaded');
    } catch (e) {
      showToast(e.message || 'Invoice failed', 'error');
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const match = (o) =>
    !q ||
    String(o.id).includes(q) ||
    (o.customer_name || '').toLowerCase().includes(q) ||
    (o.items_summary || '').toLowerCase().includes(q) ||
    (o.tcs_cn || '').toLowerCase().includes(q);

  const pending = data.pending_orders.filter(match);
  const shipped = data.shipments.filter(match);

  const inTransit = data.shipments.filter(
    (s) => !['delivered', 'cancelled', 'returned'].includes(s.order_status)
  ).length;
  const deliveredCount = data.shipments.filter((s) => s.order_status === 'delivered').length;
  const codPending = data.shipments.filter((s) => s.cod_paid_status === 'unpaid').length;

  if (loading) {
    return (
      <div className="seller-shipment-page animate-fade-in">
        <div className="shipment-loading-state">
          <Loader2 size={26} className="spin-icon" />
          <span>Loading TCS shipments…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-shipment-page animate-fade-in">
      {/* Header */}
      <div className="shipment-header">
        <div>
          <h1 className="page-title">TCS Shipments</h1>
          <p className="page-subtitle">
            {data.mode === 'demo' ? (
              <span className="tcs-mode-badge demo">Demo Mode</span>
            ) : (
              <span className="tcs-mode-badge live">Live TCS</span>
            )}
            <span>
              {data.pending_orders.length} waiting to ship · {data.shipments.length} consignments
            </span>
          </p>
        </div>
        <div className="shipment-header-actions">
          <div className="shipment-search-box">
            <Search size={15} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order, customer or CN…"
            />
          </div>
          <button className="print-all-btn" onClick={handleRefreshAll} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh Tracking'}</span>
          </button>
        </div>
      </div>

      {/* Count chips */}
      <div className="shipment-stat-chips">
        <div className="shipment-chip">
          <PackageCheck size={15} />
          <span className="chip-num">{data.pending_orders.length}</span>
          <span className="chip-label">To Ship</span>
        </div>
        <div className="shipment-chip">
          <Truck size={15} />
          <span className="chip-num">{inTransit}</span>
          <span className="chip-label">In Transit</span>
        </div>
        <div className="shipment-chip">
          <MapPin size={15} />
          <span className="chip-num">{deliveredCount}</span>
          <span className="chip-label">Delivered</span>
        </div>
        <div className="shipment-chip">
          <BadgeIndianRupee size={15} />
          <span className="chip-num">{codPending}</span>
          <span className="chip-label">COD Pending</span>
        </div>
      </div>

      {/* Ready to ship */}
      {pending.length > 0 && (
        <>
          <h2 className="shipment-section-title">Ready to Ship</h2>
          <div className="shipment-cards-list">
            {pending.map((ord) => (
              <div key={ord.id} className="shipment-card">
                <div className="shipment-card-info">
                  <div className="shipment-card-top-row">
                    <span className="order-id-label">ORDER #{ord.id}</span>
                    <span className="shipment-status-badge pending">
                      <span className="status-dot pending" /> Awaiting TCS Booking
                    </span>
                  </div>
                  <h2 className="customer-name">{ord.customer_name || 'Customer'}</h2>
                  <p className="customer-address">{ord.shipping_address}</p>
                  <div className="carrier-weight-row">
                    <div className="info-col">
                      <span className="info-label">Items</span>
                      <div className="info-value">
                        <span>{ord.items_summary}</span>
                      </div>
                    </div>
                    <div className="info-col">
                      <span className="info-label">
                        {ord.payment_method && /cod|cash/i.test(ord.payment_method) ? 'COD Amount' : 'Order Total'}
                      </span>
                      <div className="info-value">
                        <span>{fmtMoney(ord.total_amount)}</span>
                      </div>
                    </div>
                    <div className="info-col">
                      <span className="info-label">Ordered</span>
                      <div className="info-value">
                        <span>{fmtDate(ord.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shipment-card-right">
                  <button
                    className="ship-tcs-btn"
                    onClick={() => handleShip(ord.id)}
                    disabled={shippingId === ord.id}
                  >
                    {shippingId === ord.id ? (
                      <>
                        <Loader2 size={15} className="spin-icon" />
                        <span>Booking…</span>
                      </>
                    ) : (
                      <>
                        <Truck size={15} />
                        <span>Ship with TCS</span>
                      </>
                    )}
                  </button>
                  <button className="doc-action-btn" onClick={() => handleInvoice(ord.id)}>
                    <FileText size={15} />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Active shipments */}
      <h2 className="shipment-section-title">Consignments</h2>
      {shipped.length === 0 ? (
        <div className="shipment-empty-state">
          <Truck size={28} />
          <p>No TCS consignments yet — book a parcel from <strong>Ready to Ship</strong> above.</p>
        </div>
      ) : (
        <div className="shipment-cards-list">
          {shipped.map((ord) => (
            <React.Fragment key={ord.id}>
              <div className={`shipment-card ${openTrackId === ord.id ? 'tracking-open' : ''}`}>
                <div className="shipment-card-info">
                  <div className="shipment-card-top-row">
                    <span className="order-id-label">ORDER #{ord.id}</span>
                    <span
                      className={`shipment-status-badge ${
                        ord.order_status === 'delivered' ? 'ready' : 'pending'
                      }`}
                    >
                      <span className={`status-dot ${ord.order_status === 'delivered' ? 'ready' : 'pending'}`} />
                      {ord.status_label || ord.tcs_status || 'Booked'}
                    </span>
                  </div>
                  <div className="cn-row">
                    <span className="cn-chip" title="TCS consignment number">
                      CN: {ord.tcs_cn}
                    </span>
                    {ord.cod_paid_status && (
                      <span className={`cod-chip ${ord.cod_paid_status}`}>
                        COD {ord.cod_paid_status === 'paid' ? 'Collected' : 'Pending'}
                      </span>
                    )}
                  </div>
                  <h2 className="customer-name">{ord.customer_name || 'Customer'}</h2>
                  <p className="customer-address">{ord.items_summary}</p>
                  <div className="carrier-weight-row">
                    <div className="info-col">
                      <span className="info-label">Booked</span>
                      <div className="info-value">
                        <span>{fmtDate(ord.tcs_booked_at)}</span>
                      </div>
                    </div>
                    <div className="info-col">
                      <span className="info-label">Total</span>
                      <div className="info-value">
                        <span>{fmtMoney(ord.total_amount)}</span>
                      </div>
                    </div>
                    <div className="info-col">
                      <span className="info-label">Last Update</span>
                      <div className="info-value">
                        <span>{fmtDate(ord.tcs_updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shipment-card-right">
                  <button
                    className={`doc-action-btn ${openTrackId === ord.id ? 'active' : ''}`}
                    onClick={() => handleTrack(ord)}
                  >
                    <MapPin size={15} />
                    <span>{openTrackId === ord.id ? 'Hide Tracking' : 'Track'}</span>
                  </button>
                  <button className="doc-action-btn" onClick={() => handleLabel(ord.id)}>
                    <Printer size={15} />
                    <span>Label</span>
                  </button>
                  <button className="doc-action-btn" onClick={() => handleInvoice(ord.id)}>
                    <FileText size={15} />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {openTrackId === ord.id && (
                <div className="shipment-track-panel">
                  <TrackingTimeline
                    tracking={trackData}
                    loading={trackLoading}
                    onRefresh={async () => {
                      const t = await tcsTrackApi(ord.id);
                      setTrackData(t);
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
