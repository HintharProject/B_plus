/* global firebase */
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

fetch("/api/firebase-config")
  .then((response) => response.json())
  .then((config) => {
    if (config.apiKey && !firebase.apps.length) {
      firebase.initializeApp(config);
      firebase.messaging();
    }
  })
  .catch(() => {
    // Push stays disabled; no private data is logged.
  });
