import React from 'react';
import { Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './NovanestNavHeader.css';

export default function NovanestNavHeader() {
  const { navigateTo, currentPage, openLoginModal } = useCart();

  return (
    <header className="novanest-nav-header">
      <div
        className="novanest-header-logo"
        onClick={() => navigateTo('home')}
        title="Novanest Home"
      >
        <div className="novanest-logo-icon">
          <Leaf size={18} />
        </div>
        <span className="novanest-brand-name">Novanest</span>
      </div>

      <nav className="novanest-header-nav">
        <span
          className={`novanest-nav-link ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => navigateTo('home')}
        >
          Home
        </span>
        <span
          className={`novanest-nav-link ${currentPage === 'shop' ? 'active' : ''}`}
          onClick={() => navigateTo('shop')}
        >
          Shop
        </span>
        <span
          className={`novanest-nav-link ${currentPage === 'about' ? 'active' : ''}`}
          onClick={() => navigateTo('about')}
        >
          About
        </span>
        <span
          className={`novanest-nav-link ${currentPage === 'contact' ? 'active' : ''}`}
          onClick={() => navigateTo('contact')}
        >
          Contact
        </span>
      </nav>
    </header>
  );
}
