import admin from 'firebase-admin';
import path from 'path';

export const initFirebase = () => { 
    console.log("Init firebase");
    const serviceAccount = require(path.resolve(process.cwd(), 'firebase.json'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://viktoriaflutter.firebaseio.com'
    });
};

export const send = async (tokens: string[], data: any, options?: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.messaging().sendToDevice(tokens, data, options)
            .then(() => resolve())
            .catch(function(error: any) {
                console.error('Error sending message:', error);
                resolve();
            });
    });
};