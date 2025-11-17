import { useEffect, useState } from "react";
import { type OfflineMutation, offlineDB, offlineStatus } from "../lib/offline";

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(offlineStatus.isOnline);

  useEffect(() => {
    const unsubscribe = offlineStatus.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}

/**
 * Hook to track offline sync queue status
 */
export function useOfflineSyncStatus() {
  const [pending, setPending] = useState<OfflineMutation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPending = async () => {
      try {
        const mutations = await offlineDB.getPendingMutations();
        if (mounted) {
          setPending(mutations);
          setIsLoading(false);
        }
      } catch (_error) {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Load initially
    loadPending();

    // Reload every 5 seconds
    const interval = setInterval(loadPending, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    pending,
    count: pending.length,
    isLoading,
  };
}

/**
 * Hook to manage offline mutations
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineMutation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const mutations = await offlineDB.getPendingMutations();
      setQueue(mutations);
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  };

  const retryMutation = async (id: number) => {
    await offlineDB.updateMutationStatus(id, "pending");
    await refresh();
  };

  const deleteMutation = async (id: number) => {
    await offlineDB.deleteMutation(id);
    await refresh();
  };

  const clearSynced = async () => {
    await offlineDB.clearSyncedMutations();
    await refresh();
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    queue,
    isLoading,
    refresh,
    retryMutation,
    deleteMutation,
    clearSynced,
  };
}
