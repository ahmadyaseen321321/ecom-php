import React from 'react';
import { CATEGORIES as MOCK_CATEGORIES } from '../data/mockProducts';
import { useCart } from '../context/CartContext';
import { getCategoryImage } from '../services/api';
import './CategoryBubbles.css';

export default function CategoryBubbles() {
  const { liveCategories, selectedCategoryFilter, setSelectedCategoryFilter } = useCart();

  // Use live categories if available; otherwise fallback to mock categories
  const categories = liveCategories && liveCategories.length > 0
    ? liveCategories.map((cat, idx) => ({
        id: cat.id,
        name: cat.name.toUpperCase(),
        image: getCategoryImage(cat, idx)
      }))
    : MOCK_CATEGORIES.map((cat, idx) => ({
        ...cat,
        image: getCategoryImage(cat, idx)
      }));

  const handleCategoryClick = (catId) => {
    setSelectedCategoryFilter(catId);
    const element = document.getElementById('discover-more');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="categories-bubble-section">
      <div className="container">
        <div className="bubbles-row">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategoryFilter === cat.id;
            const imageSrc = cat.image || getCategoryImage(cat, idx);
            return (
              <button
                key={cat.id}
                className={`bubble-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <div className="bubble-circle">
                  <img src={imageSrc} alt={cat.name} className="bubble-img" />
                </div>
                <span className="bubble-label">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
