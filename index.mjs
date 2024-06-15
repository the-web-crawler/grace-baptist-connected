const startTime = new Date().getTime();
console.log("Notifying tokens...");

import admin from "firebase-admin";
import {initializeApp} from 'firebase-admin/app';
import {initializeApp as initializeAppDef} from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
} from "firebase/firestore";
// import {getAuth} from "firebase-admin/auth";

const app = initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: 'https://grace-baptist-of-marrero-default-rtdb.firebaseio.com'
});

const defApp = initializeAppDef({
    apiKey: "AIzaSyBGpfjezatdci9IZ9r1Wibnm19yEukAYRU",
    authDomain: "grace-baptist-of-marrero.firebaseapp.com",
    databaseURL: "https://grace-baptist-of-marrero-default-rtdb.firebaseio.com",
    projectId: "grace-baptist-of-marrero",
    storageBucket: "grace-baptist-of-marrero.appspot.com",
    messagingSenderId: "190650102395",
    appId: "1:190650102395:web:93f1dd79e342e44dd368de",
    measurementId: "G-3VK874VCQ0",
});

const messaging = admin.messaging();
const database = admin.database();
const db = getFirestore();

console.log("Fetching user data...");
const subData = (await database.ref("subscribed").once("value")).val();
const subUsers = Object.keys(subData);

console.log("Fetching announcements...");
const allDocs = await async function () {
    const theseDocs = await getDocs(collection(db, "/storage/announcements/public"));
    const arr = [];
    for (const thisDoc of theseDocs.docs) {
        const obj = {
            doc: await getDoc(thisDoc.ref)
        };
        obj.data = obj.doc.data();
        if (obj.data.parent) {
            const pData = (await getDoc(obj.data.parent)).data();
            Object.keys(pData).forEach(key => {
                if (["", null, undefined].includes(obj.data[key])) obj.data[key] = pData[key];
            });
        }
        arr.push(obj);
    };
    return arr;
}();

const validDocs = allDocs.map(v => v.doc.id);

console.log("");

const counter = {
    n: 0,
    count: function (n = -1) {
        this.n += n;
        if (this.n === 0) {
            const timeCompleted = new Date(new Date().getTime() - startTime);
            timeCompleted.setHours(0);
            console.log("");
            console.log("Process completed in", timeCompleted.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit"
            }));
            process.exit(0);
        }
    }
};

let notifSent = false;

for (const userToken of subUsers) {
    const user = subData[userToken];
    if (user.docs) {
        Object.keys(user.docs).forEach(thisDoc => {
            if (!validDocs.includes(thisDoc)) {
                counter.count(1);
                database.ref(`subscribed/${userToken}/docs/${thisDoc}`).set(null).then(() => {
                    console.log(`Removed ${thisDoc} from ${userToken}`);
                    counter.count();
                });
            }
        });
    }

    for (const thisAnn of allDocs) {
        const logNotSending = (pre = "") => {
            console.log("\x1b[2m%s\x1b[0m", `${pre}Not sending notification ${thisAnn.doc.id} to ${userToken}`);
            if (!notifSent && userToken === subUsers[subUsers.length - 1] && thisAnn.doc.id === allDocs[allDocs.length - 1].doc.id) {
                counter.count(0);
            }
        };
        if (!thisAnn.data.pOnly || ["admin", "parent"].includes(user.status)) {
            const isEvent = thisAnn.data.date?.[0];
            if ((!user.event && isEvent) || (!user.other && !isEvent)) continue;
            // const img = thisAnn.data.icon ? await getDownloadURL(ref(storage, "announcement/" + thisAnn.data.icon)) : undefined;
            const opts = {
                badge: "/assets/icon/icon.svg",
                timestamp: startTime,
                data: {
                    url: "/?announcement=" + thisAnn.doc.id
                }
            };
            if (thisAnn.data.lastIconUrl) opts.image = thisAnn.data.lastIconUrl;
            if (thisAnn.data.desc) opts.body = thisAnn.data.desc;

            const sendNotif = () => {
                counter.count(1);
                notifSent = true;
                const message = {
                    token: userToken,
                    notification: {
                        title: `${isEvent ? "New Event" : "Announcement"}${thisAnn.data.title ? ": " + thisAnn.data.title : ""}`,
                        body: opts.body || ""
                    },
                    data: {
                        data: JSON.stringify(opts)
                    }
                };

                messaging.send(message).then(() => {
                    console.log("\x1b[32m%s\x1b[0m", `Notification ${thisAnn.doc.id} successfully sent to ${userToken}`);
                    counter.count();
                }).catch((error) => {
                    const sendWarning = () => {
                        console.warn(`Notification ${thisAnn.doc.id} failed to send to ${userToken}`);
                    };
                    switch (error.code) {
                        case "messaging/registration-token-not-registered":
                            database.ref("subscribed/" + message.token).set(null).then(() => {
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
                const updates = {};
                updates[`last`] = startTime;
                counter.count(1);
                database.ref(`/subscribed/${userToken}/docs/${thisAnn.doc.id}`).update(updates).then(() => {
                    counter.count();
                }).catch(e => {
                    counter.count();
                    console.error(e);
                });
            };
            if (user.docs?.[thisAnn.doc.id]) {
                if (isEvent && user.reminder) {
                    let nextDate;
                    for (const thisDate of thisAnn.data.date) {
                        if (startTime > new Date(thisDate.to).getTime()) continue;
                        nextDate = new Date(thisDate.from).getTime();
                    }
                    if (nextDate && !(nextDate - user.docs[thisAnn.doc.id].last <= user.reminder) && nextDate - startTime <= user.reminder) {
                        sendNotif(user.docs[thisAnn.doc.id]);
                    } else {
                        logNotSending();
                    }
                } else {
                    logNotSending();
                }
            } else {
                if (user.immediate) {
                    const updates = {};
                    updates[`first`] = startTime;
                    counter.count(1);
                    database.ref(`/subscribed/${userToken}/docs/${thisAnn.doc.id}`).update(updates).then(() => {
                        sendNotif();
                        counter.count();
                    }).catch(e => {
                        console.error(e);
                        counter.count();
                    });
                }
            }
        } else {
            logNotSending("Access not permitted: ");
        }
    };

    // const message = {
    //     token: user,
    //     data: {
    //         time: String(new Date().getTime())
    //     }
    // };
};

if (subUsers.length === 0) {
    counter.count(0);
}
