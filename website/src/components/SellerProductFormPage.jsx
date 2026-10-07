import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../services/api';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Eye,
  AlertCircle,
  HelpCircle,
  Tag,
  Loader2
} from 'lucide-react';
import './SellerProductFormPage.css';

const SAMPLE_PRESET_IMAGES = [
  { label: 'Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop' },
  { label: 'Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop' },
  { label: 'Watch', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop' },
  { label: 'Glasses', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop' },
  { label: 'Bag', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600&auto=format&fit=crop' },
  { label: 'Plant', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=600&auto=format&fit=crop' }
];

export default function SellerProductFormPage({
  product = null,
  categories = [],
  onBack,
  onSave
}) {
  const { showToast } = useCart();
  const isEditing = Boolean(product && product.id);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '25',
    category_id: '1',
    sku: '',
    status: 'active',
    image: '',
    tags: 'Featured, New Arrival'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [activeTabPreview, setActiveTabPreview] = useState('editor');

  // Initialize data for edit mode
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price !== undefined ? String(product.price) : '',
        discount_price: product.discount_price ? String(product.discount_price) : '',
        stock: product.stock !== undefined ? String(product.stock) : '10',
        category_id: product.category_id ? String(product.category_id) : (categories[0]?.id ? String(categories[0].id) : '1'),
        sku: product.sku || `SKU-${product.id}`,
        status: product.status || 'active',
        image: product.main_image || product.image || '',
        tags: product.tags || 'Featured, Best Seller'
      });
      if (product.main_image || product.image) {
        setCustomImageUrl(product.main_image || product.image);
      }
    } else if (categories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category_id: String(categories[0].id)
      }));
    }
  }, [product, categories]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyImageUrl = (url) => {
    if (!url) return;
    setFormData(prev => ({ ...prev, image: url }));
    setCustomImageUrl(url);
    showToast('Image selected');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: previewUrl, imageFile: file }));
      setCustomImageUrl(previewUrl);
      showToast('Image uploaded');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter a product title');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showToast('Please enter a valid regular price');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock) || 0,
        category_id: parseInt(formData.category_id) || 1,
      });
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const regPrice = parseFloat(formData.price) || 0;
  const discPrice = parseFloat(formData.discount_price) || 0;
  const hasDiscount = discPrice > 0 && discPrice < regPrice;
  const discountPercent = hasDiscount ? Math.round(((regPrice - discPrice) / regPrice) * 100) : 0;
  const currentStock = parseInt(formData.stock) || 0;

  const currentCategoryName = categories.find(c => String(c.id) === String(formData.category_id))?.name || 'Uncategorized';

  return (
    <div className="seller-product-form-page animate-fade-in">
      {/* ─── TOP BREADCRUMB & HEADER ACTIONS ─── */}
      <div className="product-form-topbar">
        <div className="topbar-nav-left">
          <button type="button" className="btn-back-link" onClick={onBack}>
            <ArrowLeft size={17} />
            <span>Back to Products</span>
          </button>
          <div className="breadcrumb-trail">
            <span className="b-root">Products</span>
            <span className="b-divider">/</span>
            <span className="b-current">{isEditing ? `Edit #${product?.id || ''}` : 'Add New Product'}</span>
          </div>
        </div>

        <div className="topbar-actions-right">
          <button type="button" className="btn-form-discard" onClick={onBack} disabled={isSubmitting}>
            Discard
          </button>
          <button
            type="button"
            className="btn-form-save"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
          </button>
        </div>
      </div>

      {/* ─── PAGE TITLE & SUBTITLE ─── */}
      <div className="product-form-header">
        <div className="header-info">
          <h1 className="form-main-title">
            {isEditing ? `Edit Product: ${formData.name || 'Untitled'}` : 'Create New Product'}
          </h1>
          <p className="form-main-subtitle">
            {isEditing
              ? 'Update your product specifications, inventory, and pricing details below.'
              : 'Add full product information, images, pricing, and stock to list in your store.'}
          </p>
        </div>
      </div>

      {/* ─── MAIN 2-COLUMN FORM GRID ─── */}
      <form onSubmit={handleSubmit} className="product-form-grid">
        {/* ─── LEFT COLUMN (MAIN CONTENT) ─── */}
        <div className="form-left-col">
          {/* Card 1: Basic Details */}
          <div className="form-section-card">
            <div className="card-header-row">
              <div className="card-header-icon-title">
                <Package size={20} className="card-header-icon" />
                <div>
                  <h3 className="section-card-title">Basic Information</h3>
                  <p className="section-card-desc">Enter the primary details for this item</p>
                </div>
              </div>
            </div>

            <div className="form-fields-stack">
              <div className="form-group">
                <label className="form-label">
                  Product Title <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Organic Cotton Crewneck Tee"
                  className="form-input text-lg"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                <span className="field-hint">Give your product a clear, descriptive name.</span>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">SKU / Item Code</label>
                  <input
                    type="text"
                    placeholder="e.g. NOV-TSHIRT-001"
                    className="form-input"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Tags / Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium, Casual, Summer"
                    className="form-input"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Product Description</label>
                <textarea
                  rows={5}
                  placeholder="Describe your product materials, fit, care instructions, warranty, and special features..."
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                <span className="field-hint">A detailed description boosts buyer confidence and conversion rate.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Media & Image Gallery */}
          <div className="form-section-card">
            <div className="card-header-row">
              <div className="card-header-icon-title">
                <ImageIcon size={20} className="card-header-icon" />
                <div>
                  <h3 className="section-card-title">Product Media & Images</h3>
                  <p className="section-card-desc">Add high-resolution product photos</p>
                </div>
              </div>
            </div>

            <div className="media-section-body">
              {/* Image Preview & URL Input */}
              <div className="media-preview-row">
                <div className="image-main-preview-box">
                  {formData.image ? (
                    <div className="preview-img-container">
                      <img src={getImageUrl(formData.image)} alt="Preview" className="img-preview" />
                      <button
                        type="button"
                        className="btn-remove-preview-img"
                        onClick={() => handleChange('image', '')}
                        title="Remove Image"
                      >
                        <Trash2 size={15} />
                      </button>
                      <span className="main-img-badge">Main Photo</span>
                    </div>
                  ) : (
                    <div className="empty-preview-placeholder">
                      <ImageIcon size={36} className="text-gray-400" />
                      <span>No image selected</span>
                    </div>
                  )}
                </div>

                <div className="media-inputs-block">
                  <div className="form-group">
                    <label className="form-label">Image Web URL</label>
                    <div className="input-with-action">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        className="form-input"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-apply-url"
                        onClick={() => handleApplyImageUrl(customImageUrl)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* File Upload Zone */}
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden-file-input"
                      onChange={handleFileUpload}
                    />
                    <Upload size={22} className="upload-icon" />
                    <span className="upload-main-text">Upload from computer</span>
                    <span className="upload-sub-text">PNG, JPG, WEBP up to 5MB</span>
                  </label>
                </div>
              </div>

              {/* Quick Sample Image Presets */}
              <div className="preset-images-section">
                <span className="preset-title">Or choose from sample library:</span>
                <div className="preset-chips-grid">
                  {SAMPLE_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={`preset-chip-btn ${formData.image === preset.url ? 'active' : ''}`}
                      onClick={() => handleApplyImageUrl(preset.url)}
                    >
                      <img src={preset.url} alt={preset.label} className="preset-thumb" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Pricing */}
          <div className="form-section-card">
            <div className="card-header-row">
              <div className="card-header-icon-title">
                <DollarSign size={20} className="card-header-icon" />
                <div>
                  <h3 className="section-card-title">Pricing & Discounts</h3>
                  <p className="section-card-desc">Set your regular retail and optional promotional pricing</p>
                </div>
              </div>
            </div>

            <div className="pricing-fields-grid">
              <div className="form-group">
                <label className="form-label">
                  Regular Price (PKR) <span className="req">*</span>
                </label>
                <div className="currency-input-wrap">
                  <span className="currency-symbol">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="2500"
                    className="form-input pl-12"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Discount Price (PKR) <span className="optional-tag">(Optional)</span>
                </label>
                <div className="currency-input-wrap">
                  <span className="currency-symbol">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1999"
                    className="form-input pl-12"
                    value={formData.discount_price}
                    onChange={(e) => handleChange('discount_price', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {hasDiscount && (
              <div className="discount-summary-banner">
                <Sparkles size={16} className="text-emerald-600" />
                <span>
                  Shoppers will see a <strong>{discountPercent}% discount</strong>! (Rs. {discPrice.toLocaleString()} instead of Rs. {regPrice.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN (ORGANIZATION & LIVE PREVIEW) ─── */}
        <div className="form-right-col">
          {/* Card 1: Product Status */}
          <div className="form-section-card">
            <h3 className="section-card-title-sm">Status & Visibility</h3>
            <div className="status-toggle-box">
              <label className="status-radio-option">
                <input
                  type="radio"
                  name="product_status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={() => handleChange('status', 'active')}
                />
                <div className="status-radio-content">
                  <span className="status-name text-green">● Active</span>
                  <span className="status-desc">Visible and purchasable in store</span>
                </div>
              </label>

              <label className="status-radio-option">
                <input
                  type="radio"
                  name="product_status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={() => handleChange('status', 'inactive')}
                />
                <div className="status-radio-content">
                  <span className="status-name text-gray">○ Draft / Inactive</span>
                  <span className="status-desc">Hidden from search and store catalog</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: Category & Organization */}
          <div className="form-section-card">
            <h3 className="section-card-title-sm">Category</h3>
            <div className="form-group">
              <label className="form-label">Store Category <span className="req">*</span></label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 3: Inventory */}
          <div className="form-section-card">
            <h3 className="section-card-title-sm">Inventory & Stock</h3>
            <div className="form-group">
              <label className="form-label">Stock Quantity <span className="req">*</span></label>
              <div className="stock-stepper-wrap">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleChange('stock', Math.max(0, currentStock - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  required
                  className="stepper-input"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', e.target.value)}
                />
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleChange('stock', currentStock + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="stock-badge-indicator">
              {currentStock > 10 ? (
                <span className="stock-status in-stock">✓ In Stock ({currentStock} units)</span>
              ) : currentStock > 0 ? (
                <span className="stock-status low-stock">⚠ Low Stock ({currentStock} units)</span>
              ) : (
                <span className="stock-status out-of-stock">✕ Out of Stock</span>
              )}
            </div>
          </div>

          {/* Card 4: Real-Time Customer Card Preview */}
          <div className="form-section-card live-preview-card">
            <div className="preview-card-header">
              <Eye size={16} className="text-emerald-700" />
              <h3 className="section-card-title-sm m-0">Live Customer Preview</h3>
            </div>
            <p className="preview-card-subtitle">How this item appears in Novanest store</p>

            <div className="mock-product-preview-card">
              <div className="mock-img-wrapper">
                <img
                  src={formData.image ? getImageUrl(formData.image) : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop'}
                  alt="Product preview"
                  className="mock-img"
                />
                {hasDiscount && (
                  <span className="mock-discount-tag">-{discountPercent}%</span>
                )}
                <span className="mock-status-pill">{formData.status === 'active' ? 'Available' : 'Draft'}</span>
              </div>

              <div className="mock-details">
                <span className="mock-category">{currentCategoryName}</span>
                <h4 className="mock-title">{formData.name || 'Your Product Title'}</h4>
                
                <div className="mock-price-row">
                  {hasDiscount ? (
                    <>
                      <span className="mock-sale-price">Rs. {discPrice.toLocaleString()}</span>
                      <span className="mock-original-price">Rs. {regPrice.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="mock-sale-price">Rs. {regPrice > 0 ? regPrice.toLocaleString() : '0.00'}</span>
                  )}
                </div>

                <button type="button" className="mock-btn-cta">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ─── BOTTOM STICKY ACTION BAR ─── */}
      <div className="product-form-bottom-actions">
        <button type="button" className="btn-form-discard" onClick={onBack} disabled={isSubmitting}>
          Cancel & Return
        </button>
        <button
          type="button"
          className="btn-form-save"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
        </button>
      </div>
    </div>
  );
}
