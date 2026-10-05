import React from 'react';
import { TESTIMONIALS } from '../data/mockProducts';
import { Star, ShieldCheck } from 'lucide-react';
import './Testimonials.css';

export default function Testimonials() {
  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container">
        <div className="testimonials-header text-center">
          <h2 className="testimonials-title font-serif">What Our Community Says</h2>
          <p className="testimonials-subtitle">
            Real stories from our customer community on sustainable luxury and everyday quality.
          </p>
        </div>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((item) => (
            <div key={item.id} className="testimonial-card">
              {/* Star Rating */}
              <div className="star-row">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={16} className="star-icon" fill="#3C5E4B" color="#3C5E4B" />
                ))}
              </div>

              {/* Quote */}
              <p className="testimonial-quote">{item.quote}</p>

              {/* Author */}
              <div className="author-row">
                <img src={item.avatar} alt={item.author} className="author-avatar" />
                <div>
                  <h4 className="author-name">{item.author}</h4>
                  <span className="author-badge">
                    <ShieldCheck size={13} /> {item.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
