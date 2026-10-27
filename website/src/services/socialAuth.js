/**
 * Social Authentication Utilities
 * Wraps Google Identity Services for one-click login.
 */
import { GOOGLE_CLIENT_ID } from '../config/socialAuth';

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
