# Mailing System Info Dialog & Custom Sublists / Tags Plan (`2026-11-12`)

## 1. Objective (`@bo` Directive)
1. Embed a clear **Informational Dialog** on `/board/mailing-list` (`@ops` & `@prod`) explaining how the mailing list works, where emails are stored, how `localhost:3000` and Firebase Preview (`preview-2027`) share live Firestore hygiene, how Postmark connects, and who needs a Postmark login.
2. Add a non-destructive **Custom Tags / Sublists** feature (e.g., `Board Members`, `2025 Attendees`, `2025 Presenters`, `2025 Corporate Sponsors`, `All Active Subscribed`, etc.) compatible with the subscriber lists `@bo` has already imported into live Cloud Firestore.

## 2. Non-Destructive Firestore Schema & Security Compatibility (`@arch`, `@ops`)
- **Existing Subscriber Safety:** Existing documents in `mailing_subscribers` remain 100% intact; `sublists?: string[]` defaults cleanly to `[]` when absent.
- **Sublist Catalog Persistence:** Custom sublist definitions are stored in `mailing_subscribers/_meta_sublists` (`{ customSublists: string[], updatedAt: string }`), which is natively permitted under the deployed `firestore.rules` (`match /mailing_subscribers/{subscriberId}` for `board` and `admin`) and excluded from subscriber row iteration (`d.id === "_meta_sublists"`).
- **Cloud Function Broadcast Compatibility:** When writing `sublists` to Firestore, `sublist:<TagName>` entries are mirrored alongside base public `interests` (`workshop` | `student_awards` | `sponsorship`), enabling `mailingSendCampaign` to filter `segment = "sublist:<TagName>"` with zero destructive schema migrations.

## 3. UI & Workflow Enhancements (`@prod`, `@dev`)
1. **`MailingSystemInfoModal.tsx`:** Accessible modal triggered from the `/board/mailing-list` header (`How Mailing & Postmark Work`), detailing Storage & Sync, Deliverability Architecture, Postmark Setup & Login Policy, and Sublist Operations.
2. **`/board/mailing-list` Sublist & Hygiene Controls:**
   - One-click **`All Active Subscribed`** cohort filter alongside custom **Sublists / Tags** filter pills with live counts.
   - **Sublist Creator + 1-Click HEMS Presets** (`Board Members`, `2025 Attendees`, `2025 Presenters`, `2025 Corporate Sponsors`, `2027 Attendees`, `2027 Presenters`, `2027 Corporate Sponsors`).
   - **Bulk Selection & Tagging:** Table checkboxes (`Select All Filtered`) + Bulk Action Bar to add or remove any sublist across existing subscribers in one Firestore batch.
   - **Inline Row Tagging & CSV Tag-on-Import:** Per-row `+ Tag` / `×` badges, optional *Assign Sublist/Tag on CSV Upload* field, Mailchimp `TAGS` column parsing, and `Sublists` column in CSV exports.
3. **`/board/announcements` Sublist Targeting:**
   - Upgraded **Recipient Sublist / Segment** selector with `<optgroup>` sections for *Core Audience* (`All Active Subscribed`), *Custom Board Sublists*, and *Public Signup Topics*, showing exact active recipient counts.

