import db from './db';
import got from 'got';
import config from '../config';

export const getUsers = () => {
    return db.get('users');
}

export const getTags = (id: string) => {
    const user = (db.get('users') || []).filter((user: any) => user.id == id)[0];
    return user !== undefined ? user.tags : {};
}

export const getDevicesWithTag = (tag: string, value?: any) => {
    console.log(tag, value, db.get('users'), db.get('users').filter((user: any) => tag in user.tags && (!value || user.tags[tag] === value)).map((user: any) => user.id));
    return db.get('users').filter((user: any) => tag in user.tags && (!value || user.tags[tag] === value)).map((user: any) => user.id);
};