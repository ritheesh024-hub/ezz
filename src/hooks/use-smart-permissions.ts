'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAnalytics } from './use-analytics';

export type PermissionType = 'notifications' | 'location' | 'camera';

interface PermissionState {
  asked: boolean;
  status: 'granted' | 'denied' | 'prompt' | 'unsupported';
}

/**
 * Custom hook to manage smart, contextual permissions.
 * Prevents immediate prompts and provides logic for pre-permission UI.
 */
export function useSmartPermissions() {
  const db = useFirestore();
  const { user } = useUser();
  const { trackEvent } = useAnalytics();

  const [activeRequest, setActiveRequest] = useState<PermissionType | null>(null);

  // Helper to check native permission status
  const checkStatus = useCallback(async (type: PermissionType): Promise<PermissionState['status']> => {
    if (typeof window === 'undefined') return 'prompt';

    try {
      if (type === 'notifications') {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission as PermissionState['status'];
      }

      if (type === 'location' || type === 'camera') {
        const name = type === 'location' ? 'geolocation' : 'camera';
        const result = await navigator.permissions.query({ name: name as any });
        return result.state as PermissionState['status'];
      }
    } catch (e) {
      return 'prompt';
    }
    return 'prompt';
  }, []);

  const logPermissionResult = useCallback(async (type: PermissionType, result: string) => {
    if (db && user) {
      const logRef = doc(db, 'users', user.uid, 'permissions', type);
      await setDoc(logRef, {
        type,
        status: result,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    trackEvent('permission_result', { type, result });
  }, [db, user, trackEvent]);

  // The actual native request
  const triggerNativeRequest = useCallback(async (type: PermissionType) => {
    setActiveRequest(null);
    let result: string = 'denied';

    try {
      if (type === 'notifications') {
        result = await Notification.requestPermission();
      } else if (type === 'location') {
        return new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              logPermissionResult('location', 'granted');
              resolve();
            },
            () => {
              logPermissionResult('location', 'denied');
              resolve();
            }
          );
        });
      } else if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        result = 'granted';
      }
    } catch (e) {
      result = 'denied';
    }

    await logPermissionResult(type, result);
    return result;
  }, [logPermissionResult]);

  const requestSmartly = useCallback(async (type: PermissionType) => {
    const status = await checkStatus(type);
    
    // If already granted, don't show custom UI, just log or return
    if (status === 'granted') return;

    // Check if we've asked recently in this session (simple local check)
    const sessionKey = `eb_asked_${type}`;
    if (sessionStorage.getItem(sessionKey)) return;

    // Show custom explanation modal
    setActiveRequest(type);
    sessionStorage.setItem(sessionKey, 'true');
  }, [checkStatus]);

  return {
    activeRequest,
    closeRequest: () => setActiveRequest(null),
    confirmRequest: () => activeRequest && triggerNativeRequest(activeRequest),
    requestSmartly,
    checkStatus
  };
}
