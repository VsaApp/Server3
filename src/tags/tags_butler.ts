import express from 'express';
import db from './db';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { getVersionsList } from '../versions/versions_butler';
import { User, Device } from '../utils/interfaces';
import getAuth, { isDeveloper } from '../utils/auth';
import { getGrade } from '../authentication/ldap';

const tagsRouter = express.Router();
tagsRouter.use(bodyParser.json());


export const getUser = (username: string): User => {
    let user: User = (db.get('users') || []).filter((user: User) => user.username == username)[0];
    return user;
}

tagsRouter.get('/:username', (req, res) => {
    const isDev = isDeveloper(getAuth(req).username);
    if (!isDev) {
        res.status(401);
        res.json({error: 'unauthorized'});
        return;
    }
    const user = getUser(req.params.username);
    return res.json(user !== undefined ? user : {});
});

tagsRouter.get('/', (req, res) => {
    if (req.headers.authorization) {
        const user = getUser(getAuth(req).username);
        return res.json(user !== undefined ? user : {});
    }
    return res.status(401);
});

tagsRouter.post('/add', (req, res) => {
    const users: User[] = db.get('users') || [];
    const auth = getAuth(req);
    let user = users.filter((user: User) => user.username == auth.username)[0];
    if (!user) {
        users.push({
            username: auth.username,
            grade: getGrade(auth.username, auth.password),
            group: isDeveloper(auth.username) ? 5 : 1,
            devices: [],
            selected: []
        });
        user = users.filter((user: User) => user.username == auth.username)[0];
    }
    
    // If the device is updated, update it
    if (req.body.device) {
        const newDevice = req.body.device;
        const device = user.devices.filter((device: Device) => device.firebaseId === req.body.device.firebaseId)[0];
        if (!device) {
            user.devices.push({
                os: newDevice.os,
                name: newDevice.name,
                language: newDevice.language,
                firebaseId: newDevice.firebaseId,
                appVersion: newDevice.appVersion,
                notifications: newDevice.notifications,
                timestamp: new Date().toISOString()
            });
        } else {
            device.os = newDevice.os || device.os;
            device.name = newDevice.name || device.name;
            device.language = newDevice.language || device.language;
            device.firebaseId = newDevice.firebaseId || device.firebaseId;
            device.appVersion = newDevice.appVersion || device.appVersion;
            device.notifications = newDevice.notifications || device.notifications;
            device.timestamp = new Date().toISOString();
        }
    } 

    // If the selection is updated, update it
    if (req.body.selected) {
        const selected: string[] = req.body.selected;
        selected.forEach((id) => {
            const unit = id.split('-').slice(0, -1).join('-');
            const current = user.selected.filter((_id) => _id.startsWith(unit))[0];
            // If there is already a selection for this unit, replace it
            if (current) {
                user.selected[user.selected.indexOf(current)] = id;
            } else {
                user.selected.push(id);
            }
        });
    }

    db.set('users', users);
    res.json({'error': null});

    updateStats(user, req.body);
});

const updateStats = (user: User, newTags: any): void => {
    if (newTags.appVersion === undefined) return;
    const file = path.resolve(process.cwd(), 'stats.json');
    let data: any = {appStarts: {}, users: {}};
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } else {
        data = JSON.parse(fs.readFileSync(file).toString());
        if (data.appStarts === undefined) data.appStarts = {};
        if (data.users === undefined) data.users = {};
        if (data.userCount === undefined) data.userCount = {};
        if (data.appVersions === undefined) data.appVersions = {};
    }
    const today = new Date().toDateString();
    if (user.group === undefined || user.group === 1) {
        if (data.appStarts[today] === undefined) data.appStarts[today] = 0;
        if (data.users[today] === undefined) data.users[today] = [];
        if (!data.users[today].includes(user.username)) data.users[today].push(user.username);
        data.appStarts[today]++;
    }
    data.userCount[today] = db.get('devices').length;
    data.appVersions[today] = getVersionsList();
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

tagsRouter.post('/remove', (req, res) => {
    const auth = getAuth(req);
    const users: User[] = db.get('users') || [];
    const user = users.filter((user: User) => user.username == auth.username)[0];
    if (user === undefined) {
        res.json({'error': 'Invalid user'});
        return;
    }

    req.body.forEach((key: string) => {
        user.selected.splice(user.selected.indexOf(key), 1);
    });

    db.set('users', users);
    res.json({'error': null});
});

export default tagsRouter;