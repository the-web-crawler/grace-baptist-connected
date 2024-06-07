import {initializeApp} from 'firebase-admin/app';

initializeApp({
    credential: applicationDefault(),
    databaseURL: 'https://grace-baptist-of-marrero-default-rtdb.firebaseio.com'
});