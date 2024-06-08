import admin from "firebase-admin";
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from "firebase-admin/auth";

console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)

const app = initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});

// Get the messaging service.
const messaging = admin.messaging();

// Create a notification message.
const message = {
    notification: {
        title: 'New message!',
        body: 'You have a new message from John Doe.',
    },
    token: 'dQ6Y3BkZJnVl7F3OaU3Y8I:APA91bH4j5O-PtX2Aqc0FpaHCekHzUf9hMH2TPGhYM3EsZSmQ_QIc4UgA67z6I2NWsRWqrniV9AJ2y6U3pFX8q4iCo7teUQ7Nn2eGSokco-OrBx1WQISP5JLtDlLsnSzcxfUCUgyi-65',
};

// Send the notification.
messaging.send(message)
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });

// const listAllUsers = (nextPageToken) => {
//     // List batch of users, 1000 at a time.
//     getAuth()
//         .listUsers(1000, nextPageToken)
//         .then((listUsersResult) => {
//             listUsersResult.users.forEach((userRecord) => {
//                 console.log('user', userRecord.toJSON());
//             });
//             if (listUsersResult.pageToken) {
//                 // List next batch of users.
//                 listAllUsers(listUsersResult.pageToken);
//             }
//         })
//         .catch((error) => {
//             console.log('Error listing users:', error);
//         });
// };
// // Start listing users from the beginning, 1000 at a time.
// listAllUsers();
