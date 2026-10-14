import { useEffect, useState } from 'react';
import { fetchBanners } from '../services/api';

// Loads a homepage banner slot (1 = hero, 2 = promo) from the banners API.
// Returns the banner row (with image_url, badge_text, title, subtitle,
// button_text, link_type, product_id, link) or null when the slot is empty —
// callers fall back to their default design when null.
export default function useHomepageBanner(slot) {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchBanners()
      .then((rows) => {
        if (!alive) return;
        const list = Array.isArray(rows) ? rows : [];
        const row = list.find(
          (r) => Number(r.slot) === slot && r.image_url && String(r.image_url).trim() !== ''
        );
        setBanner(row || null);
      })
      .catch(() => {
        // Network/API hiccup — keep the default design
        if (alive) setBanner(null);
      });
    return () => {
      alive = false;
    };
  }, [slot]);

  return banner;
}
