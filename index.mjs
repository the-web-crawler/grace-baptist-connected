console.log("Notifying tokens...");

import admin from "firebase-admin";
import {initializeApp} from 'firebase-admin/app';
// import {getAuth} from "firebase-admin/auth";

const app = initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: 'https://grace-baptist-of-marrero-default-rtdb.firebaseio.com'
});

// Get the messaging service.
const messaging = admin.messaging();
const db = admin.database();

const subUsers = Object.keys((await db.ref("subscribed").once("value")).val());
// console.log(subUsers);

const counter = {
    n: 0,
    count: function (n = -1) {
        this.n += n;
        if (this.n === 0) {
            process.exit(0);
        }
    }
};

subUsers.forEach(async user => {
    counter.count(1);

    const message = {
        token: user,
        data: {
            time: String(new Date().getTime())
        }
    };

    messaging.send(message)
        .then((response) => {
            console.log("\x1b[32m%s\x1b[0m", "Notification successfully sent to " + user);
            counter.count();
        })
        .catch((error) => {
            const sendWarning = () => {
                console.warn("Notification failed to send to", user);
            }
            switch (error.code) {
                case "messaging/registration-token-not-registered":
                    db.ref("subscribed/" + message.token).set(null).then(() => {
                        sendWarning();
                        console.log("Token removed");
                        counter.count();
                    });
                    break;
                default:
                    sendWarning();
                    console.error(error.code);
                    counter.count();
            }
        });
});

if (subUsers.length === 0) {
    counter.count(0);
}
