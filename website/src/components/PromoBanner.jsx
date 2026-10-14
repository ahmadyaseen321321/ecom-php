import React from 'react';
import { ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl, fetchProductByIdApi } from '../services/api';
import useHomepageBanner from '../hooks/useHomepageBanner';
import './PromoBanner.css';

export default function PromoBanner() {
  const { navigateTo, showToast } = useCart();
  const banner = useHomepageBanner(2);

  const handleCtaClick = async () => {
    if (!banner) {
      document.querySelector('#discover-more')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (banner.link_type === 'product' && banner.product_id) {
      try {
        const product = await fetchProductByIdApi(banner.product_id);
        if (product && product.id) {
          navigateTo('product-details', product);
          return;
        }
      } catch (e) {
        console.error('Banner product fetch failed:', e);
      }
      showToast('This product is no longer available');
      return;
    }
    if (banner.link_type === 'url' && banner.link) {
      if (banner.link.startsWith('#')) {
        document.querySelector(banner.link)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.open(banner.link, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    document.querySelector('#discover-more')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Seller-configured banner (slot 2) replaces the default design
  if (banner) {
    const parts = String(banner.title || '').split('|').map((s) => s.trim()).filter(Boolean);
    const line1 = parts[0] || '';
    const line2 = parts.slice(1).join(' ');

    return (
      <section className="promo-banner-section">
        <div className="container">
          <div className="promo-card has-banner-bg">
            {/* Uploaded image fills the whole card at 70% opacity over the green */}
            <div className="banner-bg-layer" aria-hidden="true">
              <img src={getImageUrl(banner.image_url)} alt="" className="banner-bg-img" />
            </div>

            <div className="promo-content">
              {banner.badge_text && (
                <div className="promo-tag">
                  <Tag size={12} />
                  <span>{banner.badge_text}</span>
                </div>
              )}

              <h2 className="promo-title font-serif">
                {line1}
                {line2 && (
                  <>
                    <br />
                    <span className="text-highlight">{line2}</span>
                  </>
                )}
              </h2>

              {banner.subtitle && (
                <p className="promo-text">{banner.subtitle}</p>
              )}

              <button type="button" className="btn btn-primary promo-btn" onClick={handleCtaClick}>
                {banner.button_text || 'EXPLORE FULL CATALOG'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="promo-banner-section">
      <div className="container">
        <div className="promo-card">
          <div className="promo-content">
            <div className="promo-tag">
              <Tag size={12} />
              <span>LIMITED TIME OFFER</span>
            </div>
            
            <h2 className="promo-title font-serif">
              MID–SEASON <br />
              SOIREE.
            </h2>

            <p className="promo-text">
              Experience our curated collection of luxury items, now available at up to 50% off.
            </p>

            <button type="button" className="btn btn-primary promo-btn" onClick={handleCtaClick}>
              EXPLORE FULL CATALOG <ArrowRight size={16} />
            </button>
          </div>

          <div className="promo-image-side">
            <img
              src="/midseason_plant.png"
              alt="Mid-Season Soiree Promotion"
              className="promo-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
