const DB_NAME = 'CandlesDB';
const DB_VERSION = 1;
const STORE_NAME = 'candles';
let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('id', 'id', { unique: true });
            }
        };
    });
}

function clearCandles() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function addCandles(candles) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        for (const c of candles) {
            store.add({ open: c.open, high: c.high, low: c.low, close: c.close });
        }
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function getAllCandles() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getCandleRange(start, count) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const results = [];
        let i = 0;
        
        const request = store.openCursor();
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                if (i >= start && i < start + count) {
                    results.push(cursor.value);
                } else if (i >= start + count) {
                    resolve(results);
                    return;
                }
                i++;
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

function getCandleCount() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

console.log("db.js loaded");
