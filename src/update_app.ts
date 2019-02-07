import got from 'got';
import config from './config';
import {getUsers} from "./tags/users";

export const updateApp = async (segment: string, data: any, dev?: Boolean) => {
    if (!dev) dev = false;
    const ids = getUsers().filter((device: any) => !dev || device.tags.dev).map((device: any) => device.id);
    const dataString = {
        app_id: config.appId,
        include_player_ids: ids,
        content_available: true,
        data: {type: 'silent', data: data}
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
};