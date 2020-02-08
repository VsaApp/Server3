import { send } from './firebase';
import { Device } from './interfaces';

export const sendMessage = async (data: { devices: Device[], data: any }): Promise<void> => {
    const firebaseIds = data.devices.map((device: Device) => device.firebaseId);
    await send(firebaseIds, { data: data.data });
};

export const sendNotification = async (data: { devices: Device[], title: string, body: string, bigBody: string, data: any }): Promise<void> => {
    var firebaseIds: string[] = data.devices
        .map((device: Device) => device.firebaseId);

    data.data.title = data.title;
    data.data.bigBody = data.bigBody;
    data.data.body = data.body;

    await send(firebaseIds, {data: data.data}, {});
};
