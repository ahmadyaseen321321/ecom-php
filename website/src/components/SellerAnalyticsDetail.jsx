import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { fetchSellerAnalyticsApi } from '../services/api';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package
} from 'lucide-react';
import './SellerAnalyticsDetail.css';

const METRIC_META = {
  aov: {
    title: 'Average Order Value',
    subtitle: 'How much each order is worth, and how values are distributed',
    icon: DollarSign
  },
  orders: {
    title: 'Orders',
    subtitle: 'Order volume, statuses, payment methods and customer mix',
    icon: ShoppingBag
  },
  revenue: {
    title: 'Revenue',
    subtitle: 'Revenue over time, top products and biggest orders',
    icon: TrendingUp
  }
};

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtRs = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

// Simple CSS bar chart shared by the daily series sections
function BarChart({ data, highlightMax = false, valuePrefix = '' }) {
  if (!data || data.length === 0) return <p className="ad-empty">No data in this period.</p>;
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const maxIdx = data.reduce((best, d, i) => (Number(d.value) > Number(data[best].value) ? i : best), 0);
  // Show at most ~15 labels so long periods stay readable
  const labelStep = Math.max(1, Math.ceil(data.length / 15));
  return (
    <div className="ad-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="ad-bar-col">
          <div
            className={`ad-bar ${highlightMax && i === maxIdx ? 'ad-bar-max' : ''} ${Number(d.value) > 0 ? '' : 'ad-bar-zero'}`}
            style={{ height: `${Math.max((Number(d.value) || 0) / max * 100, Number(d.value) > 0 ? 4 : 1)}%` }}
            title={`${d.label}: ${valuePrefix}${fmt(d.value)}`}
          ></div>
          <span className="ad-bar-label">
            {i % labelStep === 0 || i === data.length - 1 ? d.label : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// Horizontal share bars (value distribution, payment split, status split)
function ShareBars({ rows, valueKey = 'count', labelKey = 'label', suffix = ' orders' }) {
  if (!rows || rows.length === 0) return <p className="ad-empty">No data in this period.</p>;
  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
  const total = rows.reduce((s, r) => s + (Number(r[valueKey]) || 0), 0);
  return (
    <div className="ad-share-bars">
      {rows.map((r, i) => {
        const val = Number(r[valueKey]) || 0;
        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
        return (
          <div key={i} className="ad-share-row">
            <div className="ad-share-head">
              <span className="ad-share-label">{r[labelKey]}</span>
              <span className="ad-share-value">{fmt(val)}{suffix}{total > 0 ? ` · ${pct}%` : ''}</span>
            </div>
            <div className="ad-share-track">
              <div className="ad-share-fill" style={{ width: `${Math.max((val / max) * 100, val > 0 ? 3 : 0)}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SellerAnalyticsDetail({ metric, days, onBack }) {
  const { showToast } = useCart();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const meta = METRIC_META[metric] || METRIC_META.revenue;
  const Icon = meta.icon;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSellerAnalyticsApi(days)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
          showToast('Failed to load analytics');
        }
      });
    return () => { cancelled = true; };
  }, [days, showToast]);

  const s = data?.summary || {};

  return (
    <div className="ad-detail-page animate-fade-in">
      {/* Header with back navigation */}
      <div className="ad-header-row">
        <button className="ad-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Overview</span>
        </button>
        <div className="ad-title-block">
          <div className="ad-title-icon"><Icon size={20} /></div>
          <div>
            <h1 className="ad-title">{meta.title} Analytics</h1>
            <p className="ad-subtitle">{meta.subtitle}</p>
          </div>
        </div>
        <span className="ad-period-pill">{days >= 3650 ? 'All Time' : days === 1 ? 'Last 24 Hours' : `Last ${days} Days`}</span>
      </div>

      {isLoading ? (
        <div className="ad-loading-state">
          <Loader2 size={26} className="animate-spin" />
          <span>Crunching your numbers…</span>
        </div>
      ) : !data ? (
        <div className="ad-loading-state">
          <span>No analytics available for this period.</span>
        </div>
      ) : (
        <>
          {/* Summary strip — always shown for context */}
          <div className="ad-summary-strip">
            <div className="ad-summary-card">
              <span className="ad-summary-label">Total Orders</span>
              <span className="ad-summary-value">{fmt(s.total_orders)}</span>
              <span className="ad-summary-hint">{s.avg_per_day_orders ?? 0} / day avg</span>
            </div>
            <div className="ad-summary-card">
              <span className="ad-summary-label">Total Revenue</span>
              <span className="ad-summary-value">{fmtRs(s.total_revenue)}</span>
              <span className="ad-summary-hint">excl. cancelled/returned</span>
            </div>
            <div className="ad-summary-card">
              <span className="ad-summary-label">Avg. Order Value</span>
              <span className="ad-summary-value">{fmtRs(s.aov)}</span>
              <span className="ad-summary-hint">median {fmtRs(s.median)}</span>
            </div>
            <div className="ad-summary-card">
              <span className="ad-summary-label">Highest Order</span>
              <span className="ad-summary-value">{fmtRs(s.highest)}</span>
              <span className="ad-summary-hint">lowest {fmtRs(s.lowest)}</span>
            </div>
            <div className="ad-summary-card">
              <span className="ad-summary-label">Best Day</span>
              <span className="ad-summary-value ad-summary-value-sm">{s.best_day || '—'}</span>
              <span className="ad-summary-hint">{fmtRs(s.best_day_revenue)}</span>
            </div>
          </div>

          <div className="ad-grid">
            {/* ── AOV-focused panels ── */}
            {metric === 'aov' && (
              <>
                <div className="ad-panel ad-panel-wide">
                  <h3 className="ad-panel-title">Average Order Value Over Time</h3>
                  <BarChart data={data.aov_trend} valuePrefix="Rs. " />
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">Order Value Distribution</h3>
                  <ShareBars rows={data.value_distribution} valueKey="count" suffix=" orders" />
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">Revenue per Value Bracket</h3>
                  <ShareBars rows={data.value_distribution.filter(r => r.revenue > 0)} valueKey="revenue" suffix="" />
                </div>
              </>
            )}

            {/* ── Orders-focused panels ── */}
            {metric === 'orders' && (
              <>
                <div className="ad-panel ad-panel-wide">
                  <h3 className="ad-panel-title">Orders Per Day</h3>
                  <BarChart data={data.orders_by_day} highlightMax />
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">Orders by Status</h3>
                  <ShareBars rows={data.orders_by_status} valueKey="count" suffix=" orders" />
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">Orders by Payment Method</h3>
                  <ShareBars rows={data.orders_by_payment} valueKey="count" suffix=" orders" />
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">New vs Returning Customers</h3>
                  <ShareBars
                    rows={[
                      { label: 'New customers', count: data.new_vs_returning?.new || 0 },
                      { label: 'Returning customers', count: data.new_vs_returning?.returning || 0 }
                    ]}
                    valueKey="count"
                    suffix=" customers"
                  />
                </div>
              </>
            )}

            {/* ── Revenue-focused panels ── */}
            {metric === 'revenue' && (
              <>
                <div className="ad-panel ad-panel-wide">
                  <h3 className="ad-panel-title">Revenue Over Time</h3>
                  <BarChart data={data.revenue_by_day} highlightMax valuePrefix="Rs. " />
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">Top Products by Revenue</h3>
                  {data.top_products_revenue?.length ? (
                    <div className="ad-product-list">
                      {data.top_products_revenue.map((p) => (
                        <div key={p.id} className="ad-product-row">
                          <div className="ad-product-info">
                            <span className="ad-product-name">{p.name}</span>
                            <span className="ad-product-units">{fmt(p.units)} units sold</span>
                          </div>
                          <span className="ad-product-revenue">{fmtRs(p.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ad-empty">No product revenue in this period.</p>
                  )}
                </div>
                <div className="ad-panel">
                  <h3 className="ad-panel-title">Revenue by Order Size</h3>
                  <ShareBars rows={data.value_distribution.filter(r => r.revenue > 0)} valueKey="revenue" suffix="" />
                </div>
              </>
            )}

            {/* Biggest orders — useful on every metric page */}
            <div className="ad-panel ad-panel-wide">
              <h3 className="ad-panel-title">Biggest Orders</h3>
              {data.top_orders?.length ? (
                <div className="ad-table-wrap">
                  <table className="ad-orders-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_orders.map((o) => (
                        <tr key={o.id}>
                          <td className="ad-cell-strong">#{o.id}</td>
                          <td>{o.customer_name || 'Customer'}</td>
                          <td>{new Date(String(o.created_at).replace(' ', 'T')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td>{fmt(o.items)}</td>
                          <td className="ad-cell-strong">{fmtRs(o.total)}</td>
                          <td><span className={`ad-status-chip ${String(o.status || '').toLowerCase()}`}>{o.status || 'pending'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ad-empty">No orders in this period.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
