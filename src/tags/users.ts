import db from './db';
import { getUser } from './tags_butler';
import { User, Course } from '../utils/interfaces';

export const getUsers = (): User[] => {
    return db.get('users');
};

export const setUsers = (users: User[]): void => {
    db.set('users', users);
};

export const getSelected = (username: string): Course[] => {
    const user = getUser(username);
    return user !== undefined ? user.selected : [];
};

export const getDevicesWithTag = (tag: string, value?: any): string[] => {
    return getUsers()
        .filter((user: User) => {
            if (tag in user.selected && (!value || user.selected[user.selected.map((i) => i.courseID).indexOf(tag)] === value)) {
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

export const clearSelections = (): void => {
    console.log('Reset user selections');
    const date = new Date().toISOString();
    getUsers().forEach((user) => {
        user.selected = [];
        user.exams = [];
        user.timestamp = date;
    });
}