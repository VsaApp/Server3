const admin = require('firebase-admin');
const path = require('path');

let init = false;

export const initFirebase = () => { 
    console.log("Init firebase");
    const serviceAccount = require(path.resolve(process.cwd(), 'firebase.json'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://viktoriaflutter.firebaseio.com'
    });
    init = true;
};

export const send = (tokens: string, data: any, options?: any) => {
    admin.messaging().sendToDevice(tokens, data, options)
        .then(function(response: any) {
            // See the MessagingDevicesResponse reference documentation for
            // the contents of response.
            //console.log('Successfully sent message:', response);
        })
        .catch(function(error: any) {
            console.log('Error sending message:', error);
        });

};