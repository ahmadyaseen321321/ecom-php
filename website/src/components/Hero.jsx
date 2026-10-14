import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl, fetchProductByIdApi } from '../services/api';
import useHomepageBanner from '../hooks/useHomepageBanner';
import './Hero.css';

export default function Hero() {
  const { navigateTo, showToast } = useCart();
  const banner = useHomepageBanner(1);

  // Button behaviour: open the linked product, follow a custom link, or
  // fall back to scrolling to the product sections.
  const handleCtaClick = async () => {
    if (!banner) {
      document.querySelector('#just-landed')?.scrollIntoView({ behavior: 'smooth' });
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
    document.querySelector('#just-landed')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Seller-configured banner (slot 1) replaces the default design
  if (banner) {
    // "LINE ONE | LINE TWO" — the part after | gets the highlight treatment
    const parts = String(banner.title || '').split('|').map((s) => s.trim()).filter(Boolean);
    const line1 = parts[0] || '';
    const line2 = parts.slice(1).join(' ');

    return (
      <section className="hero-section">
        <div className="container">
          <div className="hero-card has-banner-bg">
            {/* Uploaded image fills the whole green card at 70% opacity */}
            <div className="banner-bg-layer" aria-hidden="true">
              <img src={getImageUrl(banner.image_url)} alt="" className="banner-bg-img" />
            </div>

            <div className="hero-content">
              {banner.badge_text && (
                <div className="hero-badge">
                  <Sparkles size={12} />
                  <span>{banner.badge_text}</span>
                </div>
              )}

              <h1 className="hero-title font-serif">
                {line1}
                {line2 && (
                  <>
                    <br />
                    <span className="text-highlight">{line2}</span>
                  </>
                )}
              </h1>

              {banner.subtitle && (
                <p className="hero-subtitle">{banner.subtitle}</p>
              )}

              <div className="hero-cta-group">
                <button type="button" className="btn btn-primary hero-btn-primary" onClick={handleCtaClick}>
                  {banner.button_text || 'Shop the Collection'} <ArrowRight size={16} />
                </button>
                <a href="#just-landed" className="btn btn-outline">
                  View Lookbook
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={12} />
              <span>SUSTAINABLE COLLECTION</span>
            </div>
            
            <h1 className="hero-title font-serif">
              TIMELESS <br />
              <span className="text-highlight">ESSENTIALS.</span>
            </h1>

            <p className="hero-subtitle">
              Refined collections crafted with sustainable materials for the modern minimalist. Quality that transcends seasons.
            </p>

            <div className="hero-cta-group">
              <button type="button" className="btn btn-primary hero-btn-primary" onClick={handleCtaClick}>
                Shop the Collection <ArrowRight size={16} />
              </button>
              <a href="#just-landed" className="btn btn-outline">
                View Lookbook
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img
                src="/hero_lifestyle.png"
                alt="Timeless Essentials Collection"
                className="hero-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
