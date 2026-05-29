// Offline transaction storage using IndexedDB
const DB_NAME = 'lumo-offline';
const STORE_NAME = 'pending-transactions';
const DB_VERSION = 1;

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
  });
};

export const addOfflineTransaction = async (transaction) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction_store = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction_store.objectStore(STORE_NAME);
    const offlineTxn = {
      ...transaction,
      synced: false,
      createdAt: new Date().toISOString(),
    };
    const request = store.add(offlineTxn);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingTransactions = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction_store = db.transaction(STORE_NAME, 'readonly');
    const store = transaction_store.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result.filter(t => !t.synced));
    };
    request.onerror = () => reject(request.error);
  });
};

export const markAsSynced = async (id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction_store = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction_store.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const txn = request.result;
      txn.synced = true;
      const updateRequest = store.put(txn);
      updateRequest.onsuccess = () => resolve(txn);
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const clearSyncedTransactions = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction_store = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction_store.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const syncPendingTransactions = async (userId, api) => {
  const pending = await getPendingTransactions();
  
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const txn of pending) {
    try {
      const response = await api.transactions.create(
        userId,
        txn.category,
        txn.amount,
        txn.description,
        txn.transactionDate,
        txn.type
      );

      if (!response.error) {
        await markAsSynced(txn.id);
        synced++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error('Failed to sync transaction:', err);
      failed++;
    }
  }

  return { synced, failed };
};
