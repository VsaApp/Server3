import db from './db';
import {getUser} from './tags';

export const getUsers = () => {
    const devices = db.get('devices').filter((user: any) => user.id !== "null");
    const users = db.get('users').filter((user: any) => user.id !== "null").map((user: any) => {
        return {"id": "123", "tags": Object.assign({"onesignalId": user.id}, user.tags)};
    });
    return devices.concat(users).filter((user: any) => user.tags.onesignalId !== undefined || user.tags.firebaseId !== undefined);
};

export const getTags = (id: string) => {
    const user = getUser(id);
    return user !== undefined ? user.tags : {};
};

export const getDevicesWithTag = (tag: string, value?: any) => {
    return getUsers().filter((user: any) => tag in user.tags && (!value || user.tags[tag] === value)).map((user: any) => user.tags.onesignalId);
};
