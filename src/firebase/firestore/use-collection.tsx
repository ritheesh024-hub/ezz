'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * Robust hook for real-time Firestore collection streams.
 * Stabilized with path-based fingerprinting to prevent redundant re-subscriptions.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fingerprinting the query path to stabilize the dependency array
  const queryFingerprint = query ? (query as any)._query?.path?.toString() || 'path-pending' : 'null';

  useEffect(() => {
    if (!query || typeof window === 'undefined') {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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
        const queryPath = (query as any)?._query?.path?.toString() || 'unknown collection';
        const permissionError = new FirestorePermissionError({
          path: queryPath,
          operation: 'list',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    // Cleanup: Ensure the listener is closed before a new one starts
    return () => unsubscribe();
  }, [queryFingerprint]); 

  return { data, loading, error };
}
