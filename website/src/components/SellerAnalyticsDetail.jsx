import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { fetchSellerAnalyticsApi } from '../services/api';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  CheckCircle2,
  Users,
  Layers,
  Award,
  CreditCard,
  Clock,
  Sparkles
} from 'lucide-react';
import './SellerAnalyticsDetail.css';

const METRIC_META = {
  aov: {
    key: 'aov',
    title: 'Average Order Value',
    tagline: 'BASKET VALUE & SPEND DISTRIBUTION',
    subtitle: 'Detailed analysis of order basket sizes, ticket values, and purchasing tiers',
    icon: DollarSign,
    themeClass: 'theme-aov'
  },
  orders: {
    key: 'orders',
    title: 'Total Orders',
    tagline: 'VOLUME & FULFILLMENT VELOCITY',
    subtitle: 'Comprehensive tracking of order volumes, customer retention, and fulfillment rates',
    icon: ShoppingBag,
    themeClass: 'theme-orders'
  },
  revenue: {
    key: 'revenue',
    title: 'Period Revenue',
    tagline: 'FINANCIAL PERFORMANCE & SALES GROWTH',
    subtitle: 'In-depth financial breakdown of revenue trajectories, top earning products, and categories',
    icon: TrendingUp,
    themeClass: 'theme-revenue'
  }
};

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtRs = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

// Reusable responsive bar chart
function BarChart({ data, highlightMax = false, valuePrefix = '', barColor = '' }) {
  if (!data || data.length === 0) return <p className="ad-empty">No data in this period.</p>;
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const maxIdx = data.reduce((best, d, i) => (Number(d.value) > Number(data[best].value) ? i : best), 0);
  const labelStep = Math.max(1, Math.ceil(data.length / 15));

  return (
    <div className="ad-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="ad-bar-col">
          <div
            className={`ad-bar ${highlightMax && i === maxIdx ? 'ad-bar-max' : ''} ${Number(d.value) > 0 ? '' : 'ad-bar-zero'}`}
            style={{
              height: `${Math.max(((Number(d.value) || 0) / max) * 100, Number(d.value) > 0 ? 5 : 2)}%`,
              backgroundColor: barColor && Number(d.value) > 0 ? barColor : undefined
            }}
            title={`${d.label}: ${valuePrefix}${fmt(d.value)}`}
          />
          <span className="ad-bar-label">
            {i % labelStep === 0 || i === data.length - 1 ? d.label : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// Reusable horizontal share bars
function ShareBars({ rows, valueKey = 'count', labelKey = 'label', suffix = '', showPct = true, fillColor = '' }) {
  if (!rows || rows.length === 0) return <p className="ad-empty">No data recorded for this period.</p>;
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
              <span className="ad-share-value">
                {suffix.startsWith('Rs') ? `Rs. ${fmt(val)}` : `${fmt(val)}${suffix}`}
                {showPct && total > 0 ? ` (${pct}%)` : ''}
              </span>
            </div>
            <div className="ad-share-track">
              <div
                className="ad-share-fill"
                style={{
                  width: `${Math.max((val / max) * 100, val > 0 ? 4 : 0)}%`,
                  backgroundColor: fillColor || undefined
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SellerAnalyticsDetail({ metric: initialMetric, days, onBack }) {
  const { showToast } = useCart();
  const [currentMetric, setCurrentMetric] = useState(initialMetric || 'revenue');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const meta = METRIC_META[currentMetric] || METRIC_META.revenue;
  const Icon = meta.icon;

  useEffect(() => {
    setCurrentMetric(initialMetric || 'revenue');
  }, [initialMetric]);

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
    return () => {
      cancelled = true;
    };
  }, [days, showToast]);

  const s = data?.summary || {};

  return (
    <div className={`ad-detail-page animate-fade-in ${meta.themeClass}`}>
      {/* ── Top Bar: Back Button in white space ── */}
      <div className="ad-top-nav-bar">
        <button className="ad-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* ── Title & Switcher Row ── */}
      <div className="ad-header-row">
        <div className="ad-title-block">
          <div className="ad-title-icon">
            <Icon size={22} />
          </div>
          <div>
            <div className="ad-tagline-badge">{meta.tagline}</div>
            <h1 className="ad-title">{meta.title} Analytics</h1>
            <p className="ad-subtitle">{meta.subtitle}</p>
          </div>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="ad-metric-switcher">
          <button
            type="button"
            className={`ad-switcher-btn ${currentMetric === 'aov' ? 'active aov-btn' : ''}`}
            onClick={() => setCurrentMetric('aov')}
          >
            <DollarSign size={13} />
            <span>AOV</span>
          </button>
          <button
            type="button"
            className={`ad-switcher-btn ${currentMetric === 'orders' ? 'active orders-btn' : ''}`}
            onClick={() => setCurrentMetric('orders')}
          >
            <ShoppingBag size={13} />
            <span>Orders</span>
          </button>
          <button
            type="button"
            className={`ad-switcher-btn ${currentMetric === 'revenue' ? 'active revenue-btn' : ''}`}
            onClick={() => setCurrentMetric('revenue')}
          >
            <TrendingUp size={13} />
            <span>Revenue</span>
          </button>
        </div>

        <span className="ad-period-pill">
          {days >= 3650 ? 'All Time' : days === 1 ? 'Last 24 Hours' : `Last ${days} Days`}
        </span>
      </div>

      {isLoading ? (
        <div className="ad-loading-state">
          <Loader2 size={28} className="animate-spin" />
          <span>Analyzing your sales metrics…</span>
        </div>
      ) : !data ? (
        <div className="ad-loading-state">
          <span>No analytics data available for this timeframe.</span>
        </div>
      ) : (
        <>
          {/* =========================================================================
              SCREEN 1: AVERAGE ORDER VALUE (AOV)
              ========================================================================= */}
          {currentMetric === 'aov' && (
            <div className="ad-metric-view aov-view animate-fade-in">
              {/* Unique AOV KPI Strip */}
              <div className="ad-summary-strip aov-strip">
                <div className="ad-summary-card hero-metric-card">
                  <span className="ad-summary-label">Average Order Value (AOV)</span>
                  <span className="ad-summary-value">{fmtRs(s.aov)}</span>
                  <span className="ad-summary-hint">Mean customer basket size</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Median Order Value</span>
                  <span className="ad-summary-value">{fmtRs(s.median)}</span>
                  <span className="ad-summary-hint">50th percentile order spend</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Average Basket Size</span>
                  <span className="ad-summary-value">{s.avg_items_per_order || 0}</span>
                  <span className="ad-summary-hint">Items per order</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Peak Single Order</span>
                  <span className="ad-summary-value">{fmtRs(s.highest)}</span>
                  <span className="ad-summary-hint">Highest customer cart</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Minimum Order</span>
                  <span className="ad-summary-value">{fmtRs(s.lowest)}</span>
                  <span className="ad-summary-hint">Smallest transaction</span>
                </div>
              </div>

              {/* AOV Dedicated Grid */}
              <div className="ad-grid">
                <div className="ad-panel ad-panel-wide">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Average Order Value Over Time</h3>
                    <span className="ad-panel-badge">Daily Trajectory</span>
                  </div>
                  <BarChart data={data.aov_trend} valuePrefix="Rs. " barColor="#2b5e40" />
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Order Count by Value Tier</h3>
                    <span className="ad-panel-badge">Volume</span>
                  </div>
                  <ShareBars
                    rows={data.value_distribution}
                    valueKey="count"
                    suffix=" orders"
                    fillColor="#2b5e40"
                  />
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Revenue Generated by Basket Tier</h3>
                    <span className="ad-panel-badge">Contribution</span>
                  </div>
                  <ShareBars
                    rows={data.value_distribution.filter((r) => r.revenue > 0)}
                    valueKey="revenue"
                    suffix="Rs"
                    fillColor="#15803d"
                  />
                </div>

                {/* High Value Orders Table */}
                <div className="ad-panel ad-panel-wide">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Top Highest Value Orders</h3>
                    <span className="ad-panel-badge">Largest Baskets</span>
                  </div>
                  {data.top_orders?.length ? (
                    <div className="ad-table-wrap">
                      <table className="ad-orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items in Basket</th>
                            <th>Avg. Item Price</th>
                            <th>Order Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.top_orders.map((o) => (
                            <tr key={o.id}>
                              <td className="ad-cell-strong">#{o.id}</td>
                              <td>{o.customer_name || 'Customer'}</td>
                              <td>
                                {new Date(String(o.created_at).replace(' ', 'T')).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td>{fmt(o.items)} items</td>
                              <td>{fmtRs(o.items > 0 ? o.total / o.items : 0)}</td>
                              <td className="ad-cell-strong font-mono">{fmtRs(o.total)}</td>
                              <td>
                                <span className={`ad-status-chip ${String(o.status || '').toLowerCase()}`}>
                                  {o.status || 'pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="ad-empty">No orders found in this period.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 2: TOTAL ORDERS & FULFILLMENT VELOCITY
              ========================================================================= */}
          {currentMetric === 'orders' && (
            <div className="ad-metric-view orders-view animate-fade-in">
              {/* Unique Orders KPI Strip */}
              <div className="ad-summary-strip orders-strip">
                <div className="ad-summary-card hero-metric-card blue-hero">
                  <span className="ad-summary-label">Total Orders Placed</span>
                  <span className="ad-summary-value">{fmt(s.total_orders)}</span>
                  <span className="ad-summary-hint">Completed & active orders</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Fulfillment Velocity</span>
                  <span className="ad-summary-value">{s.avg_per_day_orders || 0}</span>
                  <span className="ad-summary-hint">Orders per day average</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Dispatch / Delivered Rate</span>
                  <span className="ad-summary-value">{s.fulfillment_rate || 0}%</span>
                  <span className="ad-summary-hint">{s.fulfilled_orders || 0} dispatched / delivered</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Total Units Sold</span>
                  <span className="ad-summary-value">{fmt(s.total_units_sold)}</span>
                  <span className="ad-summary-hint">Physical items ordered</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Customer Loyalty</span>
                  <span className="ad-summary-value">
                    {data.new_vs_returning?.new || 0} <span className="ad-mini-sub">/ {data.new_vs_returning?.returning || 0}</span>
                  </span>
                  <span className="ad-summary-hint">New vs. Returning buyers</span>
                </div>
              </div>

              {/* Orders Dedicated Grid */}
              <div className="ad-grid">
                <div className="ad-panel ad-panel-wide">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Daily Order Frequency</h3>
                    <span className="ad-panel-badge blue-badge">Daily Volume</span>
                  </div>
                  <BarChart data={data.orders_by_day} highlightMax barColor="#2563eb" />
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Orders by Fulfillment Status</h3>
                    <span className="ad-panel-badge blue-badge">Lifecycle</span>
                  </div>
                  <ShareBars
                    rows={data.orders_by_status}
                    valueKey="count"
                    suffix=" orders"
                    fillColor="#3b82f6"
                  />
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Orders by Payment Gateway</h3>
                    <span className="ad-panel-badge blue-badge">Checkout Method</span>
                  </div>
                  <ShareBars
                    rows={data.orders_by_payment}
                    valueKey="count"
                    suffix=" orders"
                    fillColor="#1d4ed8"
                  />
                </div>

                {/* Recent Orders Chronological Stream */}
                <div className="ad-panel ad-panel-wide">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Recent Order Stream</h3>
                    <span className="ad-panel-badge blue-badge">Latest Dispatches</span>
                  </div>
                  {data.recent_orders?.length ? (
                    <div className="ad-table-wrap">
                      <table className="ad-orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Placed At</th>
                            <th>Items</th>
                            <th>Payment Method</th>
                            <th>Total</th>
                            <th>Fulfillment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recent_orders.map((o) => (
                            <tr key={o.id}>
                              <td className="ad-cell-strong">#{o.id}</td>
                              <td>{o.customer_name || 'Customer'}</td>
                              <td>
                                {new Date(String(o.created_at).replace(' ', 'T')).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td>{fmt(o.items)} units</td>
                              <td>
                                <span className="ad-payment-pill">
                                  <CreditCard size={11} /> {o.payment_method || 'COD'}
                                </span>
                              </td>
                              <td className="ad-cell-strong font-mono">{fmtRs(o.total)}</td>
                              <td>
                                <span className={`ad-status-chip ${String(o.status || '').toLowerCase()}`}>
                                  {o.status || 'pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="ad-empty">No orders found in this period.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 3: PERIOD REVENUE & FINANCIAL GROWTH
              ========================================================================= */}
          {currentMetric === 'revenue' && (
            <div className="ad-metric-view revenue-view animate-fade-in">
              {/* Unique Revenue KPI Strip */}
              <div className="ad-summary-strip revenue-strip">
                <div className="ad-summary-card hero-metric-card amber-hero">
                  <span className="ad-summary-label">Gross Revenue Generated</span>
                  <span className="ad-summary-value">{fmtRs(s.total_revenue)}</span>
                  <span className="ad-summary-hint">Net of cancellations/returns</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Average Daily Run-Rate</span>
                  <span className="ad-summary-value">{fmtRs(s.avg_daily_revenue)}</span>
                  <span className="ad-summary-hint">Daily earnings run-rate</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Peak Single-Day Revenue</span>
                  <span className="ad-summary-value">{fmtRs(s.best_day_revenue)}</span>
                  <span className="ad-summary-hint">{s.best_day ? `Achieved on ${s.best_day}` : '—'}</span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Top Generating Product</span>
                  <span className="ad-summary-value ad-summary-value-sm">
                    {data.top_products_revenue?.[0]?.name ? `${data.top_products_revenue[0].name.slice(0, 18)}…` : '—'}
                  </span>
                  <span className="ad-summary-hint">
                    {data.top_products_revenue?.[0] ? fmtRs(data.top_products_revenue[0].revenue) : 'Rs. 0'}
                  </span>
                </div>
                <div className="ad-summary-card">
                  <span className="ad-summary-label">Active Selling Products</span>
                  <span className="ad-summary-value">{data.top_products_revenue?.length || 0}</span>
                  <span className="ad-summary-hint">SKUs generating sales</span>
                </div>
              </div>

              {/* Revenue Dedicated Grid */}
              <div className="ad-grid">
                <div className="ad-panel ad-panel-wide">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Revenue Generation Timeline</h3>
                    <span className="ad-panel-badge amber-badge">Gross Sales Over Time</span>
                  </div>
                  <BarChart data={data.revenue_by_day} highlightMax valuePrefix="Rs. " barColor="#d97706" />
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Top Products by Revenue</h3>
                    <span className="ad-panel-badge amber-badge">Leaderboard</span>
                  </div>
                  {data.top_products_revenue?.length ? (
                    <div className="ad-product-list">
                      {data.top_products_revenue.map((p, idx) => (
                        <div key={p.id} className="ad-product-row">
                          <div className="ad-product-rank">#{idx + 1}</div>
                          <div className="ad-product-info">
                            <span className="ad-product-name">{p.name}</span>
                            <span className="ad-product-units">{fmt(p.units)} units sold</span>
                          </div>
                          <span className="ad-product-revenue">{fmtRs(p.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ad-empty">No product sales in this period.</p>
                  )}
                </div>

                <div className="ad-panel">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Sales Revenue by Category</h3>
                    <span className="ad-panel-badge amber-badge">Catalog Split</span>
                  </div>
                  <ShareBars
                    rows={data.category_revenue || []}
                    valueKey="revenue"
                    suffix="Rs"
                    fillColor="#b45309"
                  />
                </div>

                {/* Highest Value Transactions Table */}
                <div className="ad-panel ad-panel-wide">
                  <div className="ad-panel-header">
                    <h3 className="ad-panel-title">Highest Revenue Orders</h3>
                    <span className="ad-panel-badge amber-badge">Largest Settlements</span>
                  </div>
                  {data.top_orders?.length ? (
                    <div className="ad-table-wrap">
                      <table className="ad-orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items Purchased</th>
                            <th>Settlement Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.top_orders.map((o) => (
                            <tr key={o.id}>
                              <td className="ad-cell-strong">#{o.id}</td>
                              <td>{o.customer_name || 'Customer'}</td>
                              <td>
                                {new Date(String(o.created_at).replace(' ', 'T')).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td>{fmt(o.items)} units</td>
                              <td className="ad-cell-strong font-mono">{fmtRs(o.total)}</td>
                              <td>
                                <span className={`ad-status-chip ${String(o.status || '').toLowerCase()}`}>
                                  {o.status || 'pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="ad-empty">No revenue transactions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
