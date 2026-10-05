import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  Printer,
  FileText,
  Filter,
  Truck,
  Search,
  Loader2
} from 'lucide-react';
import './SellerShipmentPage.css';

const SHIPMENT_ORDERS = [
  {
    id: '#ORD-2023-089',
    customer: 'Eleanor Vance',
    address: '123 Grove Street, Seattle, WA 98101',
    carrier: 'EcoExpress Priority',
    weight: '1.2 kg',
    status: 'Ready',
    labelReady: true,
    previewImg: 'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: '#ORD-2023-090',
    customer: 'Marcus Thorne',
    address: '450 Birchwood Lane, Austin, TX 78701',
    carrier: 'EcoExpress Standard',
    weight: '0.8 kg',
    status: 'Ready',
    labelReady: true,
    previewImg: 'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: '#ORD-2023-091',
    customer: 'Sophia Lin',
    address: '88 Maple Drive, Portland, OR 97204',
    carrier: 'EcoExpress Priority',
    weight: '3.5 kg',
    status: 'Generating...',
    labelReady: false,
    previewImg: null
  }
];

export default function SellerShipmentPage() {
  const { showToast } = useCart();
  const [orders] = useState(SHIPMENT_ORDERS);

  const handlePrintAll = () => {
    showToast('Printing all shipping documents...');
  };

  const handlePrintLabel = (orderId) => {
    showToast(`Printing label for ${orderId}`);
  };

  const handlePrintInvoice = (orderId) => {
    showToast(`Printing invoice for ${orderId}`);
  };

  return (
    <div className="seller-shipment-page animate-fade-in">
      {/* Header */}
      <div className="shipment-header">
        <div>
          <h1 className="page-title">Print Documents</h1>
          <p className="page-subtitle">Queue: Ready to Ship (4 Orders)</p>
        </div>
        <div className="shipment-header-actions">
          <button className="filter-btn" onClick={() => showToast('Filter options opened')}>
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="print-all-btn" onClick={handlePrintAll}>
            <Printer size={16} />
            <span>Print All Documents</span>
          </button>
        </div>
      </div>

      {/* Shipment Cards */}
      <div className="shipment-cards-list">
        {orders.map((ord) => (
          <div key={ord.id} className={`shipment-card ${!ord.labelReady ? 'generating' : ''}`}>
            {/* Left Info Section */}
            <div className="shipment-card-info">
              <div className="shipment-card-top-row">
                <span className="order-id-label">ORDER {ord.id}</span>
                <span className={`shipment-status-badge ${ord.labelReady ? 'ready' : 'pending'}`}>
                  {ord.labelReady ? (
                    <><span className="status-dot ready" /> Ready</>
                  ) : (
                    <><Loader2 size={13} className="spin-icon" /> Generating...</>
                  )}
                </span>
              </div>

              <h2 className="customer-name">{ord.customer}</h2>
              <p className="customer-address">{ord.address}</p>

              <div className="carrier-weight-row">
                <div className="info-col">
                  <span className="info-label">Carrier</span>
                  <div className="info-value">
                    <Truck size={14} />
                    <span>{ord.carrier}</span>
                  </div>
                </div>
                <div className="info-col">
                  <span className="info-label">Weight</span>
                  <div className="info-value">
                    <span>{ord.weight}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Preview + Buttons */}
            <div className="shipment-card-right">
              <div className={`label-preview-box ${!ord.labelReady ? 'placeholder' : ''}`}>
                {ord.labelReady ? (
                  <>
                    <img src={ord.previewImg} alt="Shipping label preview" className="label-preview-img" />
                    <div className="zoom-icon-overlay">
                      <Search size={18} />
                    </div>
                  </>
                ) : (
                  <div className="processing-placeholder">
                    <FileText size={32} className="doc-icon" />
                    <span>Processing Documents...</span>
                  </div>
                )}
              </div>

              <button
                className={`doc-action-btn ${!ord.labelReady ? 'disabled' : ''}`}
                onClick={() => handlePrintLabel(ord.id)}
                disabled={!ord.labelReady}
              >
                <Printer size={15} />
                <span>Print Label</span>
              </button>
              <button
                className={`doc-action-btn ${!ord.labelReady ? 'disabled' : ''}`}
                onClick={() => handlePrintInvoice(ord.id)}
                disabled={!ord.labelReady}
              >
                <FileText size={15} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
