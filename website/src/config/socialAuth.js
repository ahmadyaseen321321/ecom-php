// ===================================================================
// Social Auth Configuration
// ===================================================================
// Replace these placeholder IDs with your real credentials.
//
// GOOGLE:  https://console.cloud.google.com/ → APIs & Services → Credentials
// FACEBOOK: https://developers.facebook.com/ → My Apps → Settings → Basic
// ===================================================================

export const GOOGLE_CLIENT_ID = '35239460776-k8pppm2p4mkc7b0mqoc6kiumo3tp7d5m.apps.googleusercontent.com';
export const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';

// Set Facebook App ID globally for the SDK loaded in index.html
if (typeof window !== 'undefined') {
  window.__FB_APP_ID = FACEBOOK_APP_ID;
}
