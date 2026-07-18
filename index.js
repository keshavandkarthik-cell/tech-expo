/**
 * Veda — Guardian Safety Alert Cloud Function
 * ---------------------------------------------
 * Triggers whenever the client writes a new doc to:
 *   users/{uid}/safetyAlerts/{alertId}
 * (see window._fb.addSafetyAlert in index.html)
 *
 * Looks up the student's guardianEmail on their users/{uid} profile doc,
 * and emails them a plain, non-alarmist notification.
 *
 * Requires the Blaze (pay-as-you-go) plan since it makes an outbound network
 * call (sending email) — you confirmed you're already on Blaze.
 *
 * ── SETUP ──
 * 1. cd functions && npm install
 * 2. Set SMTP credentials as secrets (recommended over functions.config(),
 *    which is deprecated):
 *      firebase functions:secrets:set SMTP_USER
 *      firebase functions:secrets:set SMTP_PASS
 *    If using Gmail: SMTP_USER is the Gmail address, SMTP_PASS is a 16-char
 *    "App Password" (Google Account → Security → 2-Step Verification → App
 *    Passwords) — NOT your normal Gmail password. For anything beyond a
 *    handful of alerts a day, use a transactional provider instead (SendGrid,
 *    Postmark, Resend, etc.) — swap the transport config below accordingly.
 * 3. Deploy: firebase deploy --only functions
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();
const db = getFirestore();

const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');

const CATEGORY_LABEL = {
  self_harm: 'signs of self-harm or suicidal thoughts',
  abuse: 'signs of possible abuse or being in danger',
};

exports.onSafetyAlertCreated = onDocumentCreated(
  { document: 'users/{uid}/safetyAlerts/{alertId}', secrets: [SMTP_USER, SMTP_PASS] },
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

    const transporter = nodemailer.createTransport({
      service: 'gmail', // swap for a transactional provider's SMTP config in production
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
    });

    const subject = `Veda Safety Alert — ${studentName} may need support`;
    const text = `Hi,

This is an automated message from Veda, the study app ${studentName} uses.

During a chat with Veda's AI study companion (${when}), the conversation showed ${categoryLabel}. Veda does not share the exact message content — this alert is only a signal, not a transcript.

We'd encourage you to check in with ${studentName} directly and, if needed, connect them with a school counsellor or a professional. If you believe they're in immediate danger, please contact your local emergency services now.

This message was sent automatically because a guardian contact is registered on this account in Veda's settings. If this was a false alarm, no action is needed — please still consider checking in.

— Veda`;

    await transporter.sendMail({
      from: `Veda Safety Alerts <${SMTP_USER.value()}>`,
      to: guardianEmail,
      subject,
      text,
    });

    await snap.ref.update({ notified: true, notifiedAt: new Date().toISOString() });
    console.log(`Safety alert emailed to guardian for uid ${uid}.`);
  }
);
