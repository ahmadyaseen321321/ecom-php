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
  Layers,
  X,
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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'to_ship' | 'in_transit' | 'delivered' | 'cod_pending'

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
        showToast(`Booked with Leopards — CN: ${res.tcs_cn}`);
        await load(true);
      } else {
        showToast('Booking failed — see console', 'error');
        console.error('Leopards ship failed:', res);
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
      showToast('Leopards label downloaded — open the PDF to print');
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

  const inTransitCount = data.shipments.filter(
    (s) => !['delivered', 'cancelled', 'returned'].includes(s.order_status)
  ).length;
  const deliveredCount = data.shipments.filter((s) => s.order_status === 'delivered').length;
  const codPendingCount = data.shipments.filter((s) => s.cod_paid_status === 'unpaid').length;
  const totalAll = data.pending_orders.length + data.shipments.length;

  const q = searchQuery.trim().toLowerCase();
  const match = (o) =>
    !q ||
    String(o.id).includes(q) ||
    (o.customer_name || '').toLowerCase().includes(q) ||
    (o.items_summary || '').toLowerCase().includes(q) ||
    (o.tcs_cn || '').toLowerCase().includes(q);

  const showReadyToShip = statusFilter === 'all' || statusFilter === 'to_ship';
  const pending = showReadyToShip ? data.pending_orders.filter(match) : [];

  const showConsignments = statusFilter !== 'to_ship';
  const shipped = showConsignments
    ? data.shipments
        .filter(match)
        .filter((s) => {
          if (statusFilter === 'all') return true;
          if (statusFilter === 'in_transit') return !['delivered', 'cancelled', 'returned'].includes(s.order_status);
          if (statusFilter === 'delivered') return s.order_status === 'delivered';
          if (statusFilter === 'cod_pending') return s.cod_paid_status === 'unpaid';
          return true;
        })
    : [];

  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'to_ship': return 'To Ship';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cod_pending': return 'COD Pending';
      default: return 'All Shipments';
    }
  };

  if (loading) {
    return (
      <div className="seller-shipment-page animate-fade-in">
        <div className="shipment-loading-state">
          <Loader2 size={26} className="spin-icon" />
          <span>Loading Leopards shipments…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-shipment-page animate-fade-in">
      {/* Header */}
      <div className="shipment-header">
        <div>
          <h1 className="page-title">Leopards Shipments</h1>
          <p className="page-subtitle">
            {data.mode === 'demo' ? (
              <span className="tcs-mode-badge demo">Demo Mode</span>
            ) : (
              <span className="tcs-mode-badge live">Live Leopards</span>
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

      {/* Count chips / Filter tabs */}
      <div className="shipment-stat-chips" role="tablist" aria-label="Shipment status filters">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'all'}
          className={`shipment-chip ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
          title="Show all orders & consignments"
        >
          <Layers size={15} />
          <span className="chip-num">{totalAll}</span>
          <span className="chip-label">All</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'to_ship'}
          className={`shipment-chip ${statusFilter === 'to_ship' ? 'active' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'to_ship' ? 'all' : 'to_ship'))}
          title="Filter: Ready to ship (pending booking)"
        >
          <PackageCheck size={15} />
          <span className="chip-num">{data.pending_orders.length}</span>
          <span className="chip-label">To Ship</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'in_transit'}
          className={`shipment-chip ${statusFilter === 'in_transit' ? 'active' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'in_transit' ? 'all' : 'in_transit'))}
          title="Filter: Shipments currently in transit"
        >
          <Truck size={15} />
          <span className="chip-num">{inTransitCount}</span>
          <span className="chip-label">In Transit</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'delivered'}
          className={`shipment-chip ${statusFilter === 'delivered' ? 'active' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'delivered' ? 'all' : 'delivered'))}
          title="Filter: Successfully delivered consignments"
        >
          <MapPin size={15} />
          <span className="chip-num">{deliveredCount}</span>
          <span className="chip-label">Delivered</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'cod_pending'}
          className={`shipment-chip ${statusFilter === 'cod_pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'cod_pending' ? 'all' : 'cod_pending'))}
          title="Filter: Consignments with pending Cash on Delivery"
        >
          <BadgeIndianRupee size={15} />
          <span className="chip-num">{codPendingCount}</span>
          <span className="chip-label">COD Pending</span>
        </button>
      </div>

      {/* Active filter notification banner if filter selected */}
      {statusFilter !== 'all' && (
        <div className="shipment-filter-notice">
          <span>
            Filtering by <strong>{getFilterLabel(statusFilter)}</strong> ({statusFilter === 'to_ship' ? pending.length : shipped.length} {((statusFilter === 'to_ship' ? pending.length : shipped.length) === 1 ? 'order' : 'orders')})
          </span>
          <button type="button" className="clear-filter-btn" onClick={() => setStatusFilter('all')}>
            <X size={13} />
            <span>Show All</span>
          </button>
        </div>
      )}

      {/* Ready to ship */}
      {(statusFilter === 'to_ship' || (statusFilter === 'all' && pending.length > 0)) && (
        <>
          <h2 className="shipment-section-title">
            Ready to Ship {statusFilter === 'to_ship' ? `(${pending.length})` : ''}
          </h2>
          {pending.length === 0 ? (
            <div className="shipment-empty-state">
              <PackageCheck size={28} />
              <p>
                {searchQuery
                  ? `No orders awaiting shipment match "${searchQuery}".`
                  : 'No orders awaiting shipment.'}
              </p>
            </div>
          ) : (
            <div className="shipment-cards-list">
              {pending.map((ord) => (
                <div key={ord.id} className="shipment-card">
                  <div className="shipment-card-info">
                    <div className="shipment-card-top-row">
                      <span className="order-id-label">ORDER #{ord.id}</span>
                      <span className="shipment-status-badge pending">
                        <span className="status-dot pending" /> Awaiting Leopards Booking
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
                          <span>Ship with Leopards</span>
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
          )}
        </>
      )}

      {/* Active shipments */}
      {showConsignments && (
        <>
          <h2 className="shipment-section-title">
            {statusFilter === 'all'
              ? 'Consignments'
              : `Consignments · ${getFilterLabel(statusFilter)} (${shipped.length})`}
          </h2>
          {shipped.length === 0 ? (
            <div className="shipment-empty-state">
              <Truck size={28} />
              <p>
                {searchQuery
                  ? `No consignments match "${searchQuery}".`
                  : statusFilter === 'all'
                  ? 'No Leopards consignments yet — book a parcel from Ready to Ship above.'
                  : `No consignments found with status "${getFilterLabel(statusFilter)}".`}
              </p>
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
                        <span className="cn-chip" title="Leopards consignment number">
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
        </>
      )}
    </div>
  );
}
