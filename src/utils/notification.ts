import { send } from './firebase';
import { User, Device } from './interfaces';

export const sendMessage = async (data: {users: User[], data: any}): Promise<void> => {
    const firebaseIds = data.users
        .map((user: User) => user.devices.map((device: Device) => device.firebaseId))
        .reduce((i1: string[], i2: string[]) => i1.concat(i2));

    await send(firebaseIds, { data: data.data });
};

export const sendNotification = async (data: { users: User[], group: string, text: string, title: string, data: any }): Promise<void> => {
    const firebaseIds: string[] = data.users
        .map((user: User) => user.devices.map((device: Device) => device.firebaseId))
        .reduce((i1: string[], i2: string[]) => i1.concat(i2));

    data.data.notificationTitle = data.title;
    data.data.notificationBody = data.text;
    const dataString = {
        data: data.data
    };
    const options = {
    };

    await send(firebaseIds, dataString, options);
};