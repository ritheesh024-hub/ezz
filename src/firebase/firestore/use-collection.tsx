'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * Robust hook for real-time Firestore collection streams.
 * Optimized to handle Next.js HMR and prevent state machine crashes.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track current subscription to prevent rapid re-subscription loops
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 1. Cleanup existing listener if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // 2. Guard for empty query or server-side execution
    if (!query || typeof window === 'undefined') {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 3. Initialize onSnapshot with standardized error handling
      const unsubscribe = onSnapshot(
        query,
        (snapshot: QuerySnapshot<T>) => {
          const items = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as T[];
          setData(items);
          setLoading(false);
          setError(null);
        },
        async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'collection_stream',
            operation: 'list',
          } satisfies SecurityRuleContext);

          errorEmitter.emit('permission-error', permissionError);
          setError(serverError);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err: any) {
      console.error("Firestore Listener Setup Failed:", err);
      setError(err);
      setLoading(false);
    }

    // 4. Guaranteed cleanup on unmount or query change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [query]); // Query reference must be stable (useMemo)

  return { data, loading, error };
}
