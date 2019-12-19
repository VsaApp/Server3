import { send } from './firebase';
import { User, Device } from './interfaces';

export const sendMessage = async (data: { devices: Device[], data: any }): Promise<void> => {
    const firebaseIds = data.devices.map((device: Device) => device.firebaseId);
    await send(firebaseIds, { data: data.data });
};

export const sendNotification = async (data: { devices: Device[], group: string, text: string, title: string, data: any }): Promise<void> => {
    var firebaseIds: string[] = data.devices
        .map((device: Device) => device.firebaseId);

    data.data.notificationTitle = data.title;
    data.data.notificationBody = data.text;
    const dataString = {
        data: data.data
    };
    const options = {
    };

    await send(firebaseIds, dataString, options);
};
