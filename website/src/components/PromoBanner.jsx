import React from 'react';
import { ArrowRight, Tag } from 'lucide-react';
import './PromoBanner.css';

export default function PromoBanner() {
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

            <a href="#discover-more" className="btn btn-primary promo-btn">
              EXPLORE FULL CATALOG <ArrowRight size={16} />
            </a>
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
