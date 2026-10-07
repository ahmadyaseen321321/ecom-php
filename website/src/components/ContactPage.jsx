import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle, HelpCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ContactPage.css';

export default function ContactPage() {
  const { showToast } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('Order & Shipping Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      if (showToast) showToast('Message sent! Our support team will reply within 24 hours.');
    }, 800);
  };

  return (
    <div className="contact-page animate-fade-in">
      {/* Header */}
      <section className="contact-hero">
        <span className="contact-hero-badge">WE'RE HERE TO HELP</span>
        <h1>Get in Touch with Our Team</h1>
        <p>Have a question about an order, our sustainable materials, or interested in becoming a verified seller? Drop us a line below.</p>
      </section>

      {/* Main Grid: Form + Info Cards */}
      <div className="contact-layout-grid">
        {/* Left Side: Contact Form */}
        <div className="contact-form-card">
          {submitted ? (
            <div className="contact-success-box animate-fade-in">
              <div className="success-icon-circle">
                <CheckCircle size={44} />
              </div>
              <h2>Message Received!</h2>
              <p>Thank you for reaching out, <strong>{name}</strong>. We have sent a confirmation email to <strong>{email}</strong> and our team will get back to you shortly.</p>
              <button
                className="reset-contact-btn"
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setSubject('');
                  setMessage('');
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <h3>Send us a Message</h3>
              <p className="form-subtext">Fill out the details and our support team will respond within 24 hours.</p>

              <div className="form-row-2col">
                <div className="contact-input-group">
                  <label>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="contact-input-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="contact-input-group">
                  <label>Inquiry Topic</label>
                  <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="Order & Shipping Inquiry">Order & Shipping Inquiry</option>
                    <option value="Product Details & Materials">Product Details & Materials</option>
                    <option value="Returns & Exchanges">Returns & Exchanges</option>
                    <option value="Become a Seller / Artisan">Become a Seller / Artisan</option>
                    <option value="Wholesale & Partnerships">Wholesale & Partnerships</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>

                <div className="contact-input-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    placeholder="Brief description"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div className="contact-input-group">
                <label>Your Message *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="How can we assist you today? Please provide relevant details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button type="submit" className="contact-submit-btn" disabled={loading}>
                {loading ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Contact Information Cards */}
        <div className="contact-info-sidebar">
          <div className="info-card">
            <div className="info-icon-badge">
              <Mail size={22} />
            </div>
            <div>
              <h4>Email Us Directly</h4>
              <p className="info-main">support@novanest.com</p>
              <p className="info-sub">Average response time under 4 hours</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon-badge">
              <Phone size={22} />
            </div>
            <div>
              <h4>Call Customer Support</h4>
              <p className="info-main">+1 (800) 555-NOVA</p>
              <p className="info-sub">Toll-free, Mon-Fri 9am - 6pm EST</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon-badge">
              <MapPin size={22} />
            </div>
            <div>
              <h4>Design Studio & HQ</h4>
              <p className="info-main">123 Sustainable Way, Eco District</p>
              <p className="info-sub">San Francisco, CA 94107</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon-badge">
              <Clock size={22} />
            </div>
            <div>
              <h4>Working Hours</h4>
              <p className="info-main">Mon – Fri: 9:00 AM – 6:00 PM</p>
              <p className="info-sub">Weekend: Dedicated email support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
