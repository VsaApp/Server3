import got from 'got';
import config from './config';
import {getUsers} from "./tags/users";
import {sendMessage} from './notification';

export const updateApp = async (segment: string, data: any, dev?: Boolean) => {
    if (!dev) dev = false;
    const devices = getUsers().filter((device: any) => !dev || device.tags.dev);

    await sendMessage({
        devices: devices,
        data: data
    });
};