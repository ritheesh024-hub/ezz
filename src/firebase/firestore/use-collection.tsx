'use client';

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track query stability to avoid redundant re-subscriptions
  const queryPath = (query as any)?._query?.path?.toString() || '';

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(items);
        setLoading(false);
        setError(null);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: queryPath || 'unknown',
          operation: 'list',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    // Critical: Unsubscribe on unmount or query change
    return () => unsubscribe();
  }, [queryPath]); // Depend on path rather than object reference

  return { data, loading, error };
}
