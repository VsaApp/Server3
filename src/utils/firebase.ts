import admin from 'firebase-admin';
import path from 'path';
import { Device } from './interfaces';
import { getAllDevices, rmvDevice } from '../tags/tags_db';

export const initFirebase = () => {
    console.log("Init firebase");
    const serviceAccount = require(path.resolve(process.cwd(), 'firebase.json'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://viktoriaflutter.firebaseio.com'
    });
};

export const send = async (tokens: string[], data: any, options?: any): Promise<boolean> => {
    if (tokens.length === 0) return false;
    return new Promise((resolve, reject) => {
        admin.messaging().sendToDevice(tokens, data, options)
            .then((response) => {
                resolve(response.failureCount !== tokens.length);
            })
            .catch(function (error: any) {
                console.error('Error sending message:', error);
                resolve(false);
            });
    });
};

//TODO: test function
export const removeOldDevices = async () => {
    let count = 0;
    let devices: Device[] = await getAllDevices();
    for (var device of devices) {
        const success = await send([device.firebaseId], { data: { 'type': 'device check' } });
        if (!success) {
            rmvDevice(device);
            count++;
        }
    }
    console.log(`Removed ${count} devices`);

    // TODO: Last active for each device
    /*
    const usersCount = users.length;
    users = users.filter((user) => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        // Delete the user if he do not has any device and it was since three month not active
        if (user.devices.length === 0 && Date.parse(user.lastActive) < threeMonthsAgo.getTime()) {
            return false;
        }
        // Delete a user if he do not exists in the ldap system
        else if (!checkUsername(user.username)) {
            return false;
        }
        return true;
    });
    console.log(`Removed ${usersCount - users.length} users`);
    */
}
