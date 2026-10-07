import React, { useState } from 'react';
import { Leaf, Globe, MessageCircle, Share2, Send, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useCart();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      showToast('Thank you for subscribing to our newsletter!');
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <a href="#" className="footer-logo">
              <div className="logo-icon-sm">
                <Leaf size={16} />
              </div>
              <span className="logo-text-sm">mystore</span>
            </a>
            <p className="brand-text">
              Crafting sustainable, timeless essentials for modern living. Quality and elegance, ethically made to transcend seasons.
            </p>

            <div className="social-links">
              <a href="#" aria-label="Website" className="social-icon">
                <Globe size={18} />
              </a>
              <a href="#" aria-label="Community" className="social-icon">
                <MessageCircle size={18} />
              </a>
              <a href="#" aria-label="Share" className="social-icon">
                <Share2 size={18} />
              </a>
            </div>
          </div>

          {/* Column 1: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-title">QUICK LINKS</h4>
            <ul className="footer-nav">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('shop'); }}>Shop All</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('about'); }}>About & Sustainability</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('wishlist'); }}>My Wishlist</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('orders'); }}>Track Orders</a></li>
            </ul>
          </div>

          {/* Column 2: Customer Care */}
          <div className="footer-col">
            <h4 className="footer-title">CUSTOMER CARE</h4>
            <ul className="footer-nav">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('contact'); }}>Contact Us</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('messages'); }}>Order Messages</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('about'); }}>Our Mission</a></li>
            </ul>
          </div>

          {/* Column 3: Newsletter */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-title">NEWSLETTER</h4>
            <p className="newsletter-desc">
              Subscribe to receive updates on new arrivals, exclusive releases, and sustainable design insights.
            </p>

            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="subscribe-btn">
                {subscribed ? <Check size={16} /> : <Send size={16} />}
                <span>{subscribed ? 'Subscribed' : 'Subscribe'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} mystore. All rights reserved.</p>
          <div className="legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
