import config from './config';
import got from 'got';
import {send} from './firebase';
import { print } from 'util';

export const sendMessage = async (data: any) => {
    const onesignalIds = data.devices.filter((device: any) => device.tags.onesignalId !== undefined).map((device: any) => device.tags.onesignalId);
    const firebaseIds = data.devices.filter((device: any) => device.tags.firebaseId !== undefined).map((device: any) => device.tags.firebaseId);

    if (onesignalIds.length > 0) {
        const dataString = {
            app_id: config.appId,
            include_player_ids: onesignalIds,
            content_available: true,
            data: data.data
        };
        let url = 'https://onesignal.com/api/v1/notifications';
        const response = await got.post(
            url,
            {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Basic ' + config.appAuthKey
                },
                body: JSON.stringify(dataString)
            });
        if (response.statusCode === 200) {
            if (JSON.parse(response.body).errors !== undefined) {
                if (JSON.parse(response.body).errors[0] === 'All included players are not subscribed') {
                    return;
                }
            }
            console.log(response.body);
        } else {
            console.log(response.body);
        }
    }

    if (firebaseIds.length > 0) {
        await send(firebaseIds, {data: data.data});
    }
};

export const sendNotification = async (data: {devices: any, group: string, text: string, title: string, data: any}) => {
    const onesignalIds = data.devices.filter((device: any) => device.tags.onesignalId !== undefined).map((device: any) => device.tags.onesignalId);
    const firebaseIds = data.devices.filter((device: any) => device.tags.firebaseId !== undefined).map((device: any) => device.tags.firebaseId);

    if (onesignalIds.length > 0) {
        const dataString = {
                app_id: config.appId,
                include_player_ids: onesignalIds,
                android_group: data.group,
                contents: {
                    de: data.text,
                    en: data.text
                },
                headings: {
                    de: data.title,
                    en: data.title
                },
                data: data.data
            }
        ;
        let url = 'https://onesignal.com/api/v1/notifications';
        try {
            const response = await got.post(
                url,
                {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Basic ' + config.appAuthKey
                    },
                    body: JSON.stringify(dataString)
                });
            if (JSON.parse(response.body).errors !== undefined) {
                if (JSON.parse(response.body).errors[0] === 'All included players are not subscribed') {
                    return;
                }
            }
            console.log(response.body);
        } catch (response) {
            console.log(response);
        }
    } 
    if (firebaseIds.length > 0) {
        data.data.notificationTitle = data.title;
        data.data.notificationBody = data.text;
        const dataString = {
            data: data.data
        };
        const options = {
        };
          
        await send(firebaseIds, dataString, options);
    }
};
