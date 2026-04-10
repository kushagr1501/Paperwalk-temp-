export async function setPdf(id: string, dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("paperwalk-db", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        // Fallback if upgradeneeded wasn't called somehow and store doesn't exist
        db.close();
        reject(new Error("Object store 'pdfs' not found"));
        return;
      }
      const transaction = db.transaction("pdfs", "readwrite");
      const store = transaction.objectStore("pdfs");
      const putRequest = store.put(dataUrl, id);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPdf(id: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("paperwalk-db", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        resolve(null);
        return;
      }
      const transaction = db.transaction("pdfs", "readonly");
      const store = transaction.objectStore("pdfs");
      const getRequest = store.get(id);
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}
