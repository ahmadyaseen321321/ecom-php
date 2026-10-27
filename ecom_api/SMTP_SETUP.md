# SMTP email verification setup

Email/password signups use SMTP to send a six-digit verification code. Codes
expire after 10 minutes and allow up to five verification attempts. Existing
accounts remain verified; new email/password accounts must verify before login.

## 1. Install the database change

Run `database/migrations/20261027_email_verification.sql` once against the
existing `ecom_db` database using phpMyAdmin or the MySQL command line. Fresh
database installs should also add the migration before using email signup.

## 2. Install PHP dependencies

From `ecom_api`, run:

```powershell
composer install
```

Keep the generated `vendor` directory out of version control and run Composer
again on each deployment.

## 3. Configure SMTP outside the repository

Provide these environment variables to the Apache/PHP process, then restart
Apache:

| Variable | Example |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USERNAME` | Your SMTP mailbox address |
| `SMTP_PASSWORD` | Your provider's SMTP password or app password |
| `SMTP_ENCRYPTION` | `tls` for port 587, or `ssl` for port 465 |
| `SMTP_FROM_EMAIL` | The verified sender address |
| `SMTP_FROM_NAME` | `My Store` |

For local WAMP, enable 2-Step Verification in your Google Account, then create
an **App Password** from Google Account > Security > 2-Step Verification >
App passwords. Use that generated password, not your regular Gmail password.

The WAMP `localhost` virtual host at
`C:\wamp64\bin\apache\apache2.4.65\conf\extra\httpd-vhosts.conf` is configured
with Gmail's SMTP host, port, TLS encryption, sender display name, and the
configured Gmail sender address. Add only the newly generated App Password to
that virtual host locally:

```apache
SetEnv SMTP_PASSWORD "your-new-16-character-app-password"
```

If you change the sender mailbox, update both `SMTP_USERNAME` and
`SMTP_FROM_EMAIL` in the same virtual host.

Do not put SMTP credentials in PHP files, the frontend `.env`, or committed
files. Restart Apache after changing its environment. In production, use the
hosting provider's environment-variable or secret-management settings.

For WAMP, Google's signing keys require a trusted CA bundle for PHP cURL. The
local virtual host points `CURL_CA_BUNDLE` to WAMP's bundled CA file, and the
Google token verifier uses it when fetching Google's public signing keys.
Restart Apache after adding this setting so PHP receives the updated
environment.

Other SMTP providers supply the equivalent host, port, encryption, sender, and
authentication settings in their mail settings.

## 4. Try the signup flow

Start the website and API, sign up with an inbox you can access, enter the
six-digit code from the email, and then sign in. The resend button requests a
fresh code. If delivery fails, check the Apache/PHP error log and verify that
the SMTP settings and sender address match your provider.
