import admin from "firebase-admin";
import {initializeApp} from 'firebase-admin/app';
// import {getAuth} from "firebase-admin/auth";

import {
    // getDatabase,
    ref,
    // set,
    get,
    // push,
    child,
    // update
} from "firebase/database";

const app = initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: 'https://grace-baptist-of-marrero-default-rtdb.firebaseio.com'
});

// Get the messaging service.
const messaging = admin.messaging();
const db = admin.database();

const subUsers = Object.keys((await get(child(ref(db), "/subscribed"))).val());

subUsers.forEach(user => {
    const message = {
        token: user,
        notification: {
            title: 'My Notification Title',
            body: 'My Notification Body',
        },
    };

    messaging.send(message)
        .then((response) => {
            console.log("\x1b[32m%s\x1b[0m", "Notification successfully sent to", user);
        })
        .catch((error) => {
            console.warn("Notification failed to send to", user);
        });
});
