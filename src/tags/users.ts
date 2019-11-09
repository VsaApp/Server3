import db from './db';
import { getUser } from './tags_butler';
import { User } from '../utils/interfaces';

export const getUsers = (): User[] => {
    return db.get('users');
};

export const getSelected = (username: string): string[] => {
    const user = getUser(username);
    return user !== undefined ? user.selected : [];
};

export const getDevicesWithTag = (tag: string, value?: any): string[] => {
    return getUsers()
        .filter((user: User) => {
            if (tag in user.selected && (!value || user.selected[user.selected.indexOf(tag)] === value)) {
                return true;
            }
            return user.devices.map((device: any) => {
                return tag in Object.keys(device) &&
                    (!value || device[tag] === value);
            }).reduce((i1, i2) => i1 || i2);
        })
        .map((user: User) => user.devices.map((d) => d.firebaseId))
        .reduce((i1, i2) => i1.concat(i2));
};
