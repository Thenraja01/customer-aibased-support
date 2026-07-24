 importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
 importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

 firebase.initializeApp({
   apiKey: "AIzaSyCp4Ulp8aGidc-UyQkRBj6SE2ORGCSDYJs",
   projectId: "device-management-caa5f",
   messagingSenderId: "426626304728",
   appId: "1:426626304728:web:f7187100c1bdcddfa3a5ad",
 });

 const messaging = firebase.messaging();
 messaging.onBackgroundMessage((payload) => {
   console.log("Received background message ", payload);
   const notificationTitle = payload.notification.title;
   const notificationOptions = {
     body: payload.notification.body,
     icon: "/favicon.ico",
   };
   self.registration.showNotification(notificationTitle, notificationOptions);
 });