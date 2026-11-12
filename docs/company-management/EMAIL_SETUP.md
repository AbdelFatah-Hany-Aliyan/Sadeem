# SADEEM COMPANY MANAGEMENT SYSTEM — EMAIL SETUP & CONFIGURATION

**Provider:** Resend HTTP API (`https://api.resend.com/emails`)  
**Implementation:** `src/lib/email/emailService.ts`  
**Templates:** `src/lib/email/templates/invitationEmail.ts`, `src/lib/email/templates/activationEmail.ts`  
**Outbox Tracking:** `EmailOutbox` model  

---

## 1. Environment Variables

To enable live email dispatch in staging or production environments, configure the following environment variables:

```bash
# Resend API Key (from https://resend.com/api-keys)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"

# Verified Sender Email (must be verified in Resend dashboard)
# Example: "سديم للتقنية <onboarding@sadeem.studio>" or "team@sadeem.studio"
EMAIL_FROM="Sadeem Studio <onboarding@sadeem.studio>"

# Base URL used to construct invitation and activation links
NEXT_PUBLIC_APP_URL="https://sadeem-dev.vercel.app"
```

---

## 2. Safe Unconfigured Degradation (Development & Offline Mode)

If `RESEND_API_KEY` is missing or empty:
1. The application **does NOT crash** or throw runtime exceptions.
2. The transaction succeeds cleanly.
3. An audit record is created in the `EmailOutbox` table with status `BLOCKED_CONFIGURATION`.
4. Console logs state:
   `[EMAIL_SERVICE] RESEND_API_KEY is not configured. Email to 'user@example.com' marked as BLOCKED_CONFIGURATION.`
5. In development/testing, the raw invitation or activation link is provided to administrators for manual verification.

---

## 3. Email Outbox & Audit Model

Every email transmission attempt is logged in the `EmailOutbox` model:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `cuid` | Primary tracking ID |
| `recipientEmail` | `String` | Target candidate email |
| `subject` | `String` | Email subject header |
| `template` | `String` | Template identifier (`MEMBER_INVITATION`, `ACCOUNT_ACTIVATION`) |
| `payload` | `Json` | Full metadata context passed to the template |
| `status` | `EmailDeliveryStatus` | `PENDING`, `DELIVERED`, `FAILED`, `BLOCKED_CONFIGURATION` |
| `providerId` | `String?` | ID returned by Resend (e.g., `49a3999c-0ce1-4ea6-ab68-afcd6dc2e794`) |
| `error` | `Text?` | Provider error message if delivery failed |
| `attempts` | `Int` | Delivery retry count |
| `lastAttemptAt` | `DateTime?` | Timestamp of latest attempt |

---

## 4. Branded Arabic Email Templates

Both email templates adhere to Sadeem's visual identity:
- **Responsive HTML & Plaintext Fallback**
- **Arabic typography & RTL alignment**
- **Sadeem Brand Color Palette:** `#C28E62` (Accent Gold), `#141414` (Dark Studio Surface), `#FAFAF9` (Foreground)
- **Call-to-Action Buttons:** Prominent button linking directly to the secure token route.
- **Expiration Notices:** Clear guidance on expiration deadlines (7 days for invitations, 24 hours for activations).
