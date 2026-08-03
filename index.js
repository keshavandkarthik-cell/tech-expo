/**
 * Veda — Guardian Safety Alert Cloud Function
 * ---------------------------------------------
 * Triggers whenever the client writes a new doc to:
 *   users/{uid}/safetyAlerts/{alertId}
 * (see window._fb.addSafetyAlert in index.html)
 *
 * Looks up the student's guardianEmail on their users/{uid} profile doc,
 * and emails them a plain, non-alarmist notification — sent FROM
 * noreply@veda-net.com via Resend.
 *
 * Requires the Blaze (pay-as-you-go) plan since it makes an outbound network
 * call (sending email) — you confirmed you're already on Blaze.
 *
 * ── SETUP ──
 * 1. Sign up at resend.com (free tier: 3,000 emails/month, plenty for this).
 * 2. Resend dashboard → Domains → Add Domain → enter veda-net.com.
 *    It gives you SPF + DKIM DNS records to add wherever veda-net.com's
 *    DNS is managed (Namecheap, Cloudflare, GoDaddy, etc). This proves you
 *    own the domain so Resend is allowed to send as noreply@veda-net.com.
 *    Verification usually takes a few minutes to a few hours after adding
 *    the records.
 * 3. Resend dashboard → API Keys → create one, copy it.
 * 4. cd functions && npm install
 * 5. firebase functions:secrets:set RESEND_API_KEY
 *      (paste the key from step 3 when prompted)
 * 6. firebase deploy --only functions
 *
 * No mailbox needed for noreply@veda-net.com — nobody has to log into it,
 * it's purely a "from" address on outgoing mail.
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Resend } = require('resend');

initializeApp();
const db = getFirestore();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const FROM_ADDRESS = 'Veda Safety Alerts <noreply@veda-net.com>';

const CATEGORY_LABEL = {
  self_harm: 'signs of self-harm or suicidal thoughts',
  abuse: 'signs of possible abuse or being in danger',
};

exports.onSafetyAlertCreated = onDocumentCreated(
  { document: 'users/{uid}/safetyAlerts/{alertId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const alert = snap.data();
    const uid = event.params.uid;

    // Look up the guardian email + student name from the parent user doc.
    const userDoc = await db.collection('users').doc(uid).get();
    const guardianEmail = userDoc.exists ? userDoc.get('guardianEmail') : null;

    if (!guardianEmail) {
      console.log(`No guardianEmail set for uid ${uid} — skipping, nothing to send.`);
      await snap.ref.update({ notified: false, notifiedReason: 'no_guardian_email' });
      return;
    }

    const studentName = alert.studentName || 'Your student';
    const categoryLabel = CATEGORY_LABEL[alert.category] || 'signs of serious distress';
    const when = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : new Date().toLocaleString();

    const resend = new Resend(RESEND_API_KEY.value());

    const subject = `Veda Safety Alert — ${studentName} may need support`;
    const text = `Hi,

This is an automated message from Veda, the study app ${studentName} uses.

During a chat with Veda's AI study companion (${when}), the conversation showed ${categoryLabel}. Veda does not share the exact message content — this alert is only a signal, not a transcript.

We'd encourage you to check in with ${studentName} directly and, if needed, connect them with a school counsellor or a professional. If you believe they're in immediate danger, please contact your local emergency services now.

This message was sent automatically because a guardian contact is registered on this account in Veda's settings. If this was a false alarm, no action is needed — please still consider checking in.

— Veda`;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: guardianEmail,
      subject,
      text,
    });

    if (error) {
      console.error(`Resend failed to send safety alert for uid ${uid}:`, error);
      await snap.ref.update({ notified: false, notifiedReason: 'send_failed', error: String(error.message || error) });
      return;
    }

    await snap.ref.update({ notified: true, notifiedAt: new Date().toISOString() });
    console.log(`Safety alert emailed to guardian for uid ${uid}.`);
  }
);
