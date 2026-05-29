import { useEffect } from 'react';
import { getPendingTransactions, syncPendingTransactions } from './offlineStorage';
import api from '../api/client.js';

export const useSyncOfflineTransactions = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const handleOnline = async () => {
      try {
        const pending = await getPendingTransactions();
        if (pending.length > 0) {
          console.log(`Syncing ${pending.length} pending transactions...`);
          const result = await syncPendingTransactions(userId, api);
          console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);
        }
      } catch (err) {
        console.error('Failed to sync transactions:', err);
      }
    };

    // Sync when app comes back online
    window.addEventListener('online', handleOnline);

    // Also try syncing on component mount if online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [userId]);
};
