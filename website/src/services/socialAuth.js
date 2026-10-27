/**
 * Social Authentication Utilities
 * Wraps Google Identity Services and Facebook SDK for one-click login.
 */
import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from '../config/socialAuth';

// ─── Google Sign-In ────────────────────────────────────────────────
/**
 * Trigger Google One-Tap / popup sign-in using Google Identity Services.
 * Returns a Promise containing Google's signed identity token.
 */
export function signInWithGoogle() {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google Sign-In is not available. Please ensure your Google Client ID is authorized for this domain in Google Cloud Console.'));
      return;
    }

    // Initialize the GIS client
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response.credential) {
          reject(new Error('Google did not return an identity token.'));
          return;
        }
        resolve({ provider: 'google', id_token: response.credential });
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Prompt the popup
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        // If One-Tap is blocked (e.g. 3P cookies disabled), fall back to the button-based popup
        const buttonDiv = document.createElement('div');
        buttonDiv.id = '__gsi_temp_btn';
        buttonDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
        document.body.appendChild(buttonDiv);

        window.google.accounts.id.renderButton(buttonDiv, {
          type: 'icon',
          size: 'large',
        });

        // Programmatically click it to open popup
        const btn = buttonDiv.querySelector('div[role=button]') || buttonDiv.querySelector('iframe');
        if (btn) btn.click();

        // Clean up after a delay
        setTimeout(() => buttonDiv.remove(), 60000);
      }

      if (notification.isSkippedMoment()) {
        // User closed it – not an error, just cancelled
        reject(new Error('Google sign-in was cancelled.'));
      }
    });
  });
}

// ─── Facebook Sign-In ──────────────────────────────────────────────
/**
 * Trigger Facebook Login popup.
 * Returns a Promise that resolves with { email, name, id (provider_id), picture }.
 */
export function signInWithFacebook() {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded. Please refresh and try again.'));
      return;
    }

    // Re-init FB in case the appId was set late
    window.FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: false,
      version: 'v19.0',
    });

    window.FB.login(
      (loginResponse) => {
        if (loginResponse.status === 'connected') {
          // Fetch user profile
          window.FB.api('/me', { fields: 'id,name,email,picture.type(large)' }, (profile) => {
            if (profile && !profile.error) {
              resolve({
                provider: 'facebook',
                email: profile.email || `${profile.id}@facebook.com`,
                name: profile.name || 'Facebook User',
                provider_id: profile.id,
                picture: profile.picture?.data?.url || null,
              });
            } else {
              reject(new Error(profile?.error?.message || 'Failed to retrieve Facebook profile.'));
            }
          });
        } else {
          reject(new Error('Facebook login was cancelled or failed.'));
        }
      },
      { scope: 'email,public_profile' }
    );
  });
}
