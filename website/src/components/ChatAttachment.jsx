import React from 'react';
import { getImageUrl } from '../services/api';
import { FileText } from 'lucide-react';

const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg|heic|heif)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v|avi|mkv|3gp|ogv)$/i;

/**
 * Renders one or more chat attachments (comma-separated in a single field).
 *
 * `mimes` is an optional comma-separated list of mime types matching the files
 * left-to-right — used for local blob previews where the file name carries no
 * extension. Falls back to sniffing the extension for stored DB paths.
 */
export default function ChatAttachment({ url, mimes, maxWidth = 240 }) {
  if (!url) return null;

  const parts = String(url).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const mimeList = mimes ? String(mimes).split(',').map((s) => s.trim()) : [];

  const kindOf = (part, index) => {
    const mime = mimeList[index] || '';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('image/')) return 'image';
    if (VIDEO_RE.test(part)) return 'video';
    if (IMAGE_RE.test(part)) return 'image';
    if (part.startsWith('blob:') || part.startsWith('data:')) return 'image';
    return 'file';
  };

  const resolveSrc = (part) => {
    // Local (not yet uploaded) previews must be used as-is
    if (part.startsWith('blob:') || part.startsWith('data:')) return part;
    return getImageUrl(part);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {parts.map((part, i) => {
        const src = resolveSrc(part);
        const fileName = decodeURIComponent(part.split('/').pop() || 'attachment');
        const kind = kindOf(part, i);

        if (kind === 'video') {
          return (
            <video
              key={i}
              src={src}
              controls
              playsInline
              preload="metadata"
              style={{ maxWidth, maxHeight: 260, borderRadius: 10, background: '#000', display: 'block' }}
            />
          );
        }

        if (kind === 'image') {
          return (
            <img
              key={i}
              src={src}
              alt={fileName}
              loading="lazy"
              style={{ maxWidth, maxHeight: 260, objectFit: 'cover', borderRadius: 10, display: 'block' }}
            />
          );
        }

        return (
          <a
            key={i}
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              color: 'inherit',
              fontSize: '0.85rem',
              fontWeight: 600,
              wordBreak: 'break-all'
            }}
          >
            <FileText size={14} />
            <span>{fileName}</span>
          </a>
        );
      })}
    </div>
  );
}
