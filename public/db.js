let db;
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (e) {
  const db = e.target.result;
  db.createObjectStore("budget_entry", { autoIncrement: true });
};

request.onsuccess = function (e) {
  db = e.target.result;

  if (navigator.onLine) {
    storeBudget();
  }
};

request.onerror = function (e) {
  console.log(e.target.errorCode);
};

function saveEntry(record) {
  const transaction = db.transaction(["budget_entry"], "readwrite");
  const budgetObjectStore = transaction.objectStore("budget_entry");
  budgetObjectStore.add(record);
}

function storeBudget() {
  const transaction = db.transaction(["budget_entry"], "readwrite");
  const budgetObjectStore = transaction.objectStore("budget_entry");

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["budget_entry"], "readwrite");
          const budgetObjectStore = transaction.objectStore("budget_entry");
          budgetObjectStore.clear();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", storeBudget);
