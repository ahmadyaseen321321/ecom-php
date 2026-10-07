import React from 'react';
import { Sparkles, ShieldCheck, Heart, Leaf, Users, Award, Globe, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './AboutPage.css';

export default function AboutPage() {
  const { navigateTo } = useCart();

  return (
    <div className="about-page animate-fade-in">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-badge">
          <Leaf size={16} />
          <span>Our Story & Mission</span>
        </div>
        <h1 className="about-hero-title">
          Thoughtfully Designed for <br />
          <span className="text-highlight">Sustainable Living</span>
        </h1>
        <p className="about-hero-sub">
          At Novanest, we believe that everyday essentials should be both beautifully crafted and kind to our planet. We connect conscious creators with homes worldwide.
        </p>
      </section>

      {/* Hero Visual Grid */}
      <section className="about-visual-grid-section">
        <div className="about-image-card large">
          <img
            src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop"
            alt="Artisan studio"
          />
          <div className="about-image-overlay">
            <h3>Handcrafted with Intention</h3>
            <p>Every piece is ethically sourced and made with non-toxic, sustainable materials.</p>
          </div>
        </div>
        <div className="about-image-card small">
          <img
            src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop"
            alt="Minimalist design"
          />
          <div className="about-image-overlay">
            <h3>Timeless Aesthetics</h3>
            <p>Designed to last for generations, not seasons.</p>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="about-stats-section">
        <div className="about-stat-item">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Conscious Customers</div>
        </div>
        <div className="about-stat-item">
          <div className="stat-number">500+</div>
          <div className="stat-label">Verified Artisans</div>
        </div>
        <div className="about-stat-item">
          <div className="stat-number">100%</div>
          <div className="stat-label">Eco-friendly Packaging</div>
        </div>
        <div className="about-stat-item">
          <div className="stat-number">4.9★</div>
          <div className="stat-label">Average Satisfaction</div>
        </div>
      </section>

      {/* Core Values */}
      <section className="about-values-section">
        <div className="section-header-center">
          <span className="section-badge">WHY WE EXIST</span>
          <h2>The Values That Guide Every Product</h2>
        </div>

        <div className="about-values-grid">
          <div className="about-value-card">
            <div className="value-icon-box bg-green">
              <Leaf size={24} />
            </div>
            <h3>Earth-First Philosophy</h3>
            <p>From organic cotton to reclaimed woods and biodegradable ceramics, zero compromise on environmental integrity.</p>
          </div>

          <div className="about-value-card">
            <div className="value-icon-box bg-olive">
              <Users size={24} />
            </div>
            <h3>Fair Trade & Ethical Craft</h3>
            <p>We work directly with independent makers, paying fair wages and empowering local creative economies.</p>
          </div>

          <div className="about-value-card">
            <div className="value-icon-box bg-gold">
              <Award size={24} />
            </div>
            <h3>Uncompromising Quality</h3>
            <p>Every product undergoes rigorous durability tests to ensure it enriches your daily ritual for years to come.</p>
          </div>

          <div className="about-value-card">
            <div className="value-icon-box bg-blue">
              <Globe size={24} />
            </div>
            <h3>Carbon-Neutral Shipping</h3>
            <p>We offset 100% of carbon emissions for every order delivered right to your doorstep.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-cta-section">
        <div className="about-cta-card">
          <h2>Ready to Elevate Your Space?</h2>
          <p>Discover hand-curated collections of sustainable homeware, apparel, and lifestyle essentials.</p>
          <button className="about-cta-btn" onClick={() => navigateTo('shop')}>
            <span>Explore The Collection</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
