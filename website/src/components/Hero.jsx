import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import './Hero.css';

export default function Hero() {
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
              <a href="#seasonal-archive" className="btn btn-primary hero-btn-primary">
                Shop the Collection <ArrowRight size={16} />
              </a>
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
