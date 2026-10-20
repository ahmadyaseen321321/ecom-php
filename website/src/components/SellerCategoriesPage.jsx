import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import {
  fetchCategories,
  saveCategoryApi,
  deleteCategoryApi,
  getImageUrl,
  getCategoryImage,
  isCustomCategoryImageUrl
} from '../services/api';
import './SellerCategoriesPage.css';

export default function SellerCategoriesPage() {
  const { showToast, setLiveCategories } = useCart();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation modal state
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDeleteWarning, setForceDeleteWarning] = useState(null);

  const fileInputRef = useRef(null);

  const loadCategories = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchCategories();
      if (Array.isArray(data)) {
        setCategories(data);
        if (typeof setLiveCategories === 'function') {
          setLiveCategories(data);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      if (!silent) showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCatName('');
    setSelectedParentId('');
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setSelectedParentId(cat.parent_id ? String(cat.parent_id) : '');
    setImageFile(null);
    const existingImg = cat.icon || cat.image || '';
    setImagePreview(existingImg && isCustomCategoryImageUrl(existingImg) ? getImageUrl(existingImg) : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    setCatName('');
    setSelectedParentId('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image must be smaller than 8MB', 'error');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = catName.trim();
    if (!trimmedName) {
      showToast('Please enter a category name', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: trimmedName,
        parent_id: selectedParentId || null,
        imageFile: imageFile || null
      };

      if (editingCategory) {
        payload.id = editingCategory.id;
      }

      const res = await saveCategoryApi(payload);
      if (res && res.status !== 'error') {
        showToast(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
        closeModal();
        await loadCategories(true);
      } else {
        showToast(res?.message || 'Failed to save category', 'error');
      }
    } catch (err) {
      console.error('Save category error:', err);
      showToast(err.message || 'An error occurred while saving category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const promptDelete = (cat) => {
    setDeletingCategory(cat);
    setForceDeleteWarning(null);
  };

  const confirmDelete = async (force = false) => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await deleteCategoryApi(deletingCategory.id, force);
      if (res && res.status === 'success') {
        showToast('Category deleted successfully');
        setDeletingCategory(null);
        setForceDeleteWarning(null);
        await loadCategories(true);
      } else if (res && res.product_count) {
        setForceDeleteWarning({
          count: res.product_count,
          message: res.message || `${res.product_count} products are currently linked to this category.`
        });
      } else {
        showToast(res?.message || 'Failed to delete category', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.message || 'Error deleting category', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (cat.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="seller-categories-page animate-fade-in">
      {/* Header */}
      <div className="cat-page-header">
        <div>
          <h1 className="page-title">Store Categories</h1>
          <p className="page-subtitle">
            Manage your product categories, subcategories, and cover photos.
          </p>
        </div>
        <div className="cat-header-actions">
          <button className="cat-refresh-btn" onClick={() => loadCategories()} title="Refresh list">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="cat-add-btn" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="cat-controls-row">
        <div className="cat-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="cat-stats-badge">
          <Layers size={15} />
          <span>{categories.length} total categories</span>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="cat-loading-state">
          <Loader2 size={32} className="animate-spin" />
          <span>Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="cat-empty-state">
          <div className="cat-empty-icon">
            <FolderPlus size={36} />
          </div>
          <h3>{searchQuery ? 'No matching categories' : 'No categories yet'}</h3>
          <p>
            {searchQuery
              ? `No category matches "${searchQuery}". Try a different keyword.`
              : 'Add your first product category with a photo to organize your catalog.'}
          </p>
          {!searchQuery && (
            <button className="cat-add-btn" onClick={openAddModal}>
              <Plus size={15} />
              <span>Add Your First Category</span>
            </button>
          )}
        </div>
      ) : (
        <div className="cat-grid">
          {filteredCategories.map((cat, idx) => {
            const hasCustomImage = isCustomCategoryImageUrl(cat.icon || cat.image || cat.image_url);
            const imageSrc = hasCustomImage ? getImageUrl(cat.icon || cat.image || cat.image_url) : getCategoryImage(cat, idx);
            const productCount = cat.product_count !== undefined ? Number(cat.product_count) : null;

            return (
              <div className="cat-card" key={cat.id}>
                <div className="cat-card-media">
                  <img
                    src={imageSrc}
                    alt={cat.name}
                    className="cat-card-img"
                    onError={(e) => {
                      e.target.src = getCategoryImage(cat.name, idx);
                    }}
                  />
                  <div className="cat-card-overlay">
                    <button
                      className="cat-overlay-btn edit"
                      onClick={() => openEditModal(cat)}
                      title="Edit Category & Picture"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="cat-overlay-btn delete"
                      onClick={() => promptDelete(cat)}
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                  {productCount !== null && (
                    <span className="cat-product-pill">
                      <Package size={11} />
                      {productCount} {productCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>

                <div className="cat-card-body">
                  <div className="cat-title-row">
                    <h3 className="cat-card-name" title={cat.name}>{cat.name}</h3>
                    <span className="cat-id-chip">#{cat.id}</span>
                  </div>
                  <div className="cat-card-footer">
                    <span className="cat-meta-type">
                      {cat.parent_id ? 'Subcategory' : 'Main Category'}
                    </span>
                    <button
                      className="cat-inline-edit-btn"
                      onClick={() => openEditModal(cat)}
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="cat-modal-backdrop" onClick={closeModal}>
          <div className="cat-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <Layers size={18} />
                </div>
                <div>
                  <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
                  <p>{editingCategory ? 'Update category details and cover photo' : 'Add a new category to your storefront'}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal} disabled={isSaving}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="cat-modal-form">
              {/* Category Name */}
              <div className="form-group">
                <label className="form-label">
                  Category Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Luxury Handbags, Smart Watches, Home Accents"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Optional Parent Category */}
              <div className="form-group">
                <label className="form-label">Parent Category (Optional)</label>
                <select
                  className="form-select"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !editingCategory || String(c.id) !== String(editingCategory.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <span className="form-helper">
                  Select a parent to make this a nested subcategory.
                </span>
              </div>

              {/* Picture Upload Option */}
              <div className="form-group">
                <label className="form-label">Category Picture</label>
                <div
                  className={`cat-dropzone ${imagePreview ? 'has-preview' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {imagePreview ? (
                    <div className="cat-preview-container">
                      <img src={imagePreview} alt="Preview" className="cat-preview-img" />
                      <div className="cat-preview-overlay">
                        <Upload size={18} />
                        <span>Click to Change Picture</span>
                      </div>
                    </div>
                  ) : (
                    <div className="cat-dropzone-prompt">
                      <div className="dropzone-icon-circle">
                        <ImageIcon size={22} />
                      </div>
                      <div className="dropzone-text">
                        <span className="dropzone-highlight">Click to upload category picture</span>
                        <span className="dropzone-specs">Supports PNG, JPG, WEBP or GIF (Max 8MB)</span>
                      </div>
                    </div>
                  )}
                </div>
                {imageFile && (
                  <span className="file-selected-tag">
                    <CheckCircle2 size={13} /> Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              <div className="cat-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Category...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="cat-modal-backdrop" onClick={() => !isDeleting && setDeletingCategory(null)}>
          <div className="cat-modal-dialog delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon-wrap">
              <AlertCircle size={28} />
            </div>
            <h2>Delete Category</h2>
            <p>
              Are you sure you want to remove <strong>"{deletingCategory.name}"</strong>?
            </p>

            {forceDeleteWarning ? (
              <div className="force-delete-warning-box">
                <p>
                  <strong>Warning:</strong> {forceDeleteWarning.message}
                </p>
                <p className="force-subtext">
                  Deleting this category will set its products to uncategorized.
                </p>
                <div className="cat-modal-footer">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => {
                      setDeletingCategory(null);
                      setForceDeleteWarning(null);
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-modal-danger"
                    onClick={() => confirmDelete(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Force Delete Category'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="cat-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeletingCategory(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-danger"
                  onClick={() => confirmDelete(false)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Category'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
