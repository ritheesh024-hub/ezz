
'use server';

/**
 * @fileOverview Server-side actions for handling SMS OTP generation and verification.
 * Supports Twilio and Fast2SMS, or falls back to Console Logging for Development.
 */

import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Sends a 4-digit OTP to the provided phone number.
 * Falls back to console logging if no API keys are found.
 */
export async function sendSMSOTP(phoneNumber: string) {
  const { db } = initializeFirebase();
  
  // 1. Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  try {
    // 2. Store the OTP in Firestore for verification
    const otpRef = doc(db, 'otp_codes', phoneNumber);
    await setDoc(otpRef, {
      otp,
      expiresAt,
      createdAt: serverTimestamp(),
    });

    // 3. SMS Provider Selection
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
    const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY;

    // --- TWILIO INTEGRATION ---
    if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
      const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
          To: `+91${phoneNumber}`,
          From: TWILIO_PHONE,
          Body: `Your Ezzy Bites verification code is: ${otp}`
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Twilio failed to send SMS');
      
      return { success: true, message: 'OTP sent successfully via Twilio' };
    }

    // --- FAST2SMS INTEGRATION ---
    if (FAST2SMS_KEY && FAST2SMS_KEY !== 'YOUR_API_KEY') {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_KEY}&route=otp&variables_values=${otp}&numbers=${phoneNumber}`;
      const response = await fetch(url, { method: 'GET' });
      const result = await response.json();
      if (!result.return) throw new Error(result.message || 'Fast2SMS failed to send SMS');
      
      return { success: true, message: 'OTP sent successfully via Fast2SMS' };
    }

    // --- DEVELOPMENT SIMULATOR (Fallback) ---
    // Log to server console for testing
    console.log('\n--- EZZY BITES OTP SIMULATOR ---');
    console.log(`📱 TO: +91 ${phoneNumber}`);
    console.log(`🔐 CODE: ${otp}`);
    console.log(`💡 NOTE: Check this terminal for codes during testing.`);
    console.log('--------------------------------\n');

    return { 
      success: true, 
      message: 'SIMULATOR MODE: Check your server terminal logs for the 4-digit code.' 
    };

  } catch (error: any) {
    console.error('Failed to send OTP:', error);
    return { success: false, message: error.message || 'Failed to send OTP' };
  }
}

/**
 * Verifies the 4-digit OTP for the provided phone number.
 */
export async function verifySMSOTP(phoneNumber: string, enteredOtp: string) {
  const { db } = initializeFirebase();
  const otpRef = doc(db, 'otp_codes', phoneNumber);

  try {
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return { success: false, message: 'OTP expired or not requested' };
    }

    const data = otpSnap.data();
    
    // Check if expired
    if (Date.now() > data.expiresAt) {
      await deleteDoc(otpRef);
      return { success: false, message: 'OTP has expired' };
    }

    // Check if matches
    if (data.otp !== enteredOtp) {
      return { success: false, message: 'Invalid OTP code' };
    }

    // Success! Delete the used OTP
    await deleteDoc(otpRef);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to verify OTP:', error);
    return { success: false, message: 'Verification failed' };
  }
}
