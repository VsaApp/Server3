import express from 'express';
import db from './db';
import got from 'got';
import config from '../config';
import crypto from 'crypto';
import {getDevicesWithTag} from '../tags/users';
import {getDevices} from '../replacementplan/notifications';
import {updateApp} from '../update_app';

const groupsRouter = express.Router();
const nodemailer = require('nodemailer');

groupsRouter.post('/add', (req, res) => {
    if (req.body.username === undefined) {
        res.json({ error: 'Missing username' });
        return;
    }
    if (req.body.password === undefined) {
        res.json({ error: 'Missing password' });
        return;
    }
    if (req.body.info === undefined) {
        res.json({ error: 'Missing info' });
        return;
    }
    const groups = db.get('groups') || [];
    if (groups.filter((group: { username: string }) => {
        return group.username === req.body.username;
    }).length > 0) {
        res.json({ error: 'User already exists' });
        return;
    }
    const allIds = groups.map((group: {statusId: number}) => statusId);
    let statusId = crypto.randomBytes(8).toString('hex');
    while (allIds.includes(statusId)) statusId = crypto.randomBytes(8).toString('hex');

    groups.push({
        username: req.body.username,
        password: req.body.password,
        info: req.body.info,
        status: 'waiting',
        statusId: statusId,
        follower: -1,
        posts: []
    });
    db.set('groups', groups);
    res.json({ error: null });

    // Send request mail to vsa@2bad2c0.de
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.2bad2c0.de',
        port: 587,
        secure: false,
        auth: {
            user: config.emailUser,
            pass: config.emailKey
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: `"VsaApp" <${config.emailUser}>`, // sender address
        to: config.emailUser, // list of receivers
        subject: 'Gruppe "' + req.body.username + '" wurde erstellt', // Subject line
        text: `Es wurde eine neue Gruppe erstellt! \n\n ${req.body.username}\n${req.body.info}`, // plain text body
        html: `<p>Es wurde eine neue Gruppe erstellt:</p><p><b>${req.body.username}</b><br>${req.body.info}</p>` +
                `<p><a href="${config.apiEndpoint}/messageboard/groups/activate/${statusId}" target="_blank">Akzeptieren</a><br><a href="${config.apiEndpoint}/messageboard/groups/block/${statusId}" target="_blank">Blockieren</a></p>`
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error: any, info: any) => {});

});

groupsRouter.get('/activate/:id', async (req, res) => {
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { statusId: number }) => {
        return group.statusId.toString() === req.params.id;
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid id' });
        return;
    }
    if (group.status == 'activated') res.json({ error: null });
    group.status = 'activated';
    db.set('groups', groups);
    res.json({ error: null });

    const devices = getDevicesWithTag('messageboard-' + group.username.replace(/ /g, '-'), true);
    if (devices.length > 0) {
        const dataString = {
            app_id: config.appId,
            include_player_ids: devices,
            android_group: 'messageboard-' + group.username,
            android_group_message: {
                de: '$[notif_count] Gruppenbestätigungen',
                en: '$[notif_count] Gruppenbestätigungen',
            },
            android_led_color: 'ff5bc638',
            android_accent_color: 'ff5bc638',
            contents: {
                de: 'Die Gruppe "' + group.username + '" wurde aktiviert!',
                en: 'Die Gruppe "' + group.username + '" wurde aktiviert!',
            },
            headings: {
                de: 'Schwarzes Brett',
                en: 'Schwarzes Brett'
            },
            data: {
                type: 'messageboard-confirm',
                group: req.params.username
            }
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

    updateApp('ALL', {'type': 'messageboard-group', 'action': 'activate', 'group': group.username});
});

groupsRouter.get('/block/:id', async (req, res) => {
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { statusId: number }) => {
        return group.statusId.toString() === req.params.id;
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid id' });
        return;
    }
    if (group.status == 'blocked') res.json({ error: null });
    group.status = 'blocked';
    db.set('groups', groups);
    res.json({ error: null });

    const devices = getDevicesWithTag('messageboard-' + group.username.replace(/ /g, '-'), true);
    if (devices.length > 0) {
        const dataString = {
            app_id: config.appId,
            include_player_ids: devices,
            android_group: 'messageboard-' + group.username,
            android_group_message: {
                de: '$[notif_count] Gruppenbestätigungen',
                en: '$[notif_count] Gruppenbestätigungen',
            },
            android_led_color: 'ff5bc638',
            android_accent_color: 'ff5bc638',
            contents: {
                de: 'Die Gruppe "' + group.username + '" wurde blockiert!',
                en: 'Die Gruppe "' + group.username + '" wurde blockiert!',
            },
            headings: {
                de: 'Schwarzes Brett',
                en: 'Schwarzes Brett'
            },
            data: {
                type: 'messageboard-confirm',
                group: req.params.username
            }
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

    updateApp('ALL', {'type': 'messageboard-group', 'action': 'block', 'group': group.username});
});


groupsRouter.get('/info/:username', (req, res) => {
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { username: string }) => {
        return group.username === req.params.username;
    }).map((group: { username: string, info: string, status: string, follower: number, posts: [] }) => {
        return {
            username: group.username,
            info: group.info,
            status: group.status,
            follower: group.follower,
            post_count: group.posts.length
        };
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid username' });
        return;
    }
    res.json(group);
});

groupsRouter.get('/list', (req, res) => {
    const groups = db.get('groups') || [];
    res.json(groups.map((group: { username: string, info: string, status: string, follower: number, posts: [] }) => {
        return {
            username: group.username,
            info: group.info,
            status: group.status,
            follower: group.follower,
            post_count: group.posts.length
        };
    }));
});

groupsRouter.post('/update/:username/:password', (req, res) => {
    if (req.body.username === undefined) {
        res.json({ error: 'Missing username' });
        return;
    }
    if (req.body.password === undefined) {
        res.json({ error: 'Missing password' });
        return;
    }
    if (req.body.info === undefined) {
        res.json({ error: 'Missing info' });
        return;
    }
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { username: string }) => {
        return group.username === req.params.username;
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid username' });
        return;
    }
    if (group.password !== req.params.password) {
        res.json({ error: 'Invalid credentials' });
        return;
    }
    group.username = req.body.username;
    group.password = req.body.password;
    group.info = req.body.info;
    db.set('groups', groups);
    res.json({ error: null });

    updateApp('ALL', {'type': 'messageboard-group', 'action': 'update', 'group': group.username});
});

groupsRouter.get('/login/:username/:password', (req, res) => {
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { username: string }) => {
        return group.username === req.params.username;
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid username' });
        return;
    }
    if (group.password !== req.params.password) {
        res.json({ error: 'Invalid credentials' });
        return;
    }
    res.json({ error: null });
});

groupsRouter.get('/delete/:username/:password', (req, res) => {
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { username: string }) => {
        return group.username === req.params.username;
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid username' });
        return;
    }
    if (group.password !== req.params.password) {
        res.json({ error: 'Invalid credentials' });
        return;
    }
    groups.splice(groups.indexOf(group), 1);
    db.set('groups', groups);
    res.json({ error: null });

    updateApp('ALL', {'type': 'messageboard-group', 'action': 'delete', 'group': group.username});
});

const updateFollowers = async () => {
    let devices: any = JSON.parse(await getDevices());
    devices = devices.players.map((device: any) => {
        const tags = device.tags;
        return Object.keys(tags)
            .filter(key => key.startsWith('messageboard'))
            .reduce((obj: any, key) => {
                obj[key] = tags[key];
                return obj;
        }, {});
    });
    db.set('groups', (db.get('groups') || []).map((group: any) => {
        group.follower = devices.filter((device: any) => device['messageboard-' + group.username.replace(/ /g, '-')] !== undefined).length;
        return group;
    }));
};

updateFollowers();
setInterval(updateFollowers, 60000);

export default groupsRouter;
