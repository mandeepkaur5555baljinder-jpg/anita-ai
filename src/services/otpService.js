/**
 * otpService.js — Real Gmail OTP using EmailJS (free)
 * Setup: https://www.emailjs.com/
 * Fill in your credentials from your EmailJS dashboard in .env
 */
import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

/* Generates a secure 6-digit OTP and stores it with a 10-min expiry */
export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  sessionStorage.setItem('anita_otp', JSON.stringify({ otp, expiry }));
  return otp;
};

/* Sends the OTP email via EmailJS to the user's Gmail */
export const sendOTP = async (email) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS is not configured. Please check your .env file.');
  }

  const otp = generateOTP();

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: email,
      to_name: email.split('@')[0],
      otp_code: otp,
      app_name: 'Anita AI',
      expiry_minutes: '10',
    },
    PUBLIC_KEY
  ).catch((err) => {
    console.error('[EmailJS] Full error:', err);
    const msg = err?.text || err?.message || JSON.stringify(err);
    throw new Error(`EmailJS: ${msg}`);
  });

  return true;
};

/* Verifies the entered OTP against stored value */
export const verifyOTP = (entered) => {
  try {
    const stored = JSON.parse(sessionStorage.getItem('anita_otp') || '{}');
    if (!stored.otp || !stored.expiry) return { valid: false, reason: 'No OTP found. Please request a new one.' };
    if (Date.now() > stored.expiry) {
      sessionStorage.removeItem('anita_otp');
      return { valid: false, reason: 'OTP expired. Please request a new one.' };
    }
    if (stored.otp !== entered.trim()) return { valid: false, reason: 'Incorrect OTP. Please try again.' };
    sessionStorage.removeItem('anita_otp');
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Something went wrong. Please try again.' };
  }
};
