let db;
let budgetVersion;

const request = indexedDB.open('BudgetDB', budgetVersion || 1);

request.onupgradeneeded = function (e) {

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('BudgetStore', { autoIncrement: true });
    }
};

request.onerror = function (e) {
    console.log(`IndexedDB error ${e.target.errorCode}`);
};

function checkDatabase() {
    let transaction = db.transaction(['BudgetStore'], 'readwrite');
    
    const store = transaction.objectStore('BudgetStore');
    
    const getAll = store.getAll();
    
    getAll.onsuccess = function () {
        
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => response.json())
            .then((res) => {
                if (res.length !== 0) {
                    transaction = db.transaction(['BudgetStore'], 'readwrite');

                    const currentStore = transaction.objectStore('BudgetStore');

                    currentStore.clear();
                }
            });
        };
    };
};

request.onsuccess = function (e) {
    db = e.target.result;
    // checks if app is online before reading from indexedDB
    if (navigator.onLine) {
        checkDatabase();
    }
};

const saveRecord = (record) => {
    const transaction = db.transaction(['BudgetStore'], 'readwrite');

    const store = transaction.objectStore('BudgetStore');

    store.add(record);
};

window.addEventListener('online', checkDatabase);
