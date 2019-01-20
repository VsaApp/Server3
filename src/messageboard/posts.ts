import crypto from 'crypto';
import express from 'express';
import got from 'got';
import db from './db';
import config from '../config';
import {updateApp} from '../update_app';

const postsRouter = express.Router();
postsRouter.post('/add/:username/:password', async (req, res) => {
    if (req.body.title === undefined) {
        res.json({ error: 'Missing title' });
        return;
    }
    if (req.body.text === undefined) {
        res.json({ error: 'Missing text' });
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
    let allIdLists = groups.map((group: {posts: []}) => group.posts.map((post: {id: string}) => post.id));
    let allIds: string[] = [];
    allIdLists.forEach((ids: []) => allIds.concat(ids));
    let id = crypto.randomBytes(8).toString('hex');
    while (allIds.indexOf(id) > -1) id = crypto.randomBytes(8).toString('hex');

    const time = new Date().toISOString();
    group.posts.push({
        title: req.body.title,
        text: req.body.text,
        id,
        time
    });
    db.set('groups', groups);
    res.json({ error: null, id, time });
    const dataString = {
        app_id: config.appId,
        filters: [{ field: 'tag', key: 'messageboard-' + req.params.username.replace(/ /g, '-'), relation: '=', value: true }],
        android_group: 'messageboard',
        android_group_message: {
            de: '$[notif_count] neue Mitteilungen auf dem schwarzen Brett',
            en: '$[notif_count] neue Mitteilungen auf dem schwarzen Brett',
        },
        android_led_color: 'ff5bc638',
        android_accent_color: 'ff5bc638',
        contents: {
            de: req.body.title,
            en: req.body.title
        },
        headings: {
            de: req.params.username,
            en: req.params.username
        },
        data: {
            type: 'messageboard',
            group: req.params.username
        }
    }
        ;
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

    updateApp('ALL', {'type': 'messageboard-post', 'action': 'add', 'group': req.params.username});
});

postsRouter.post('/update/:id/:password', (req, res) => {
    if (req.body.title === undefined) {
        res.json({ error: 'Missing title' });
        return;
    }
    if (req.body.text === undefined) {
        res.json({ error: 'Missing text' });
        return;
    }
    const groups = db.get('groups') || [];

    const group = groups.filter((group: {posts: {id: string}[]}) => group.posts.filter((post: {id: string}) => post.id === req.params.id).length > 0)[0];
    if (group === undefined) {
        res.json({ error: 'Invalid id' });
        return;
    }
    if (group !== undefined && group.password !== req.params.password) {
        res.json({ error: 'Invalid credentials' });
        return;
    }
    const post = group.posts.filter((post: {id: string}) => post.id === req.params.id)[0];

    post.title = req.body.title;
    post.text = req.body.text;
    db.set('groups', groups);
    res.json({ error: null });

    updateApp('ALL', {'type': 'messageboard-post', 'action': 'update', 'group': group.username});
});

postsRouter.get('/delete/:id/:password', (req, res) => {
    const groups = db.get('groups') || [];

    const group = groups.filter((group: {posts: {id: string}[]}) => group.posts.filter((post: {id: string}) => post.id === req.params.id).length > 0)[0];
    if (group === undefined) {
        res.json({ error: 'Invalid id' });
        return;
    }
    if (group !== undefined && group.password !== req.params.password) {
        res.json({ error: 'Invalid credentials' });
        return;
    }

    const post = group.posts.filter((post: {id: string}) => post.id === req.params.id)[0];

    group.posts.splice(group.posts.indexOf(post), 1);
    db.set('groups', groups);
    res.json({ error: null });

    updateApp('ALL', {'type': 'messageboard-post', 'action': 'delete', 'group': group.username});
});

postsRouter.get('/list/:username/:start/:end', (req, res) => {
    const groups = db.get('groups') || [];
    const group = groups.filter((group: { username: string }) => {
        return group.username === req.params.username;
    })[0];
    if (group === undefined) {
        res.json({ error: 'Invalid username' });
        return;
    }
    group.posts = group.posts.sort((a: { title: string, text: string, id: string, time: string }, b: { title: string, text: string, id: string, time: string }) => {
        return (a.time < b.time) ? 1 : ((a.time > b.time) ? -1 : 0);
    });
    group.posts = group.posts.slice(parseInt(req.params.start), parseInt(req.params.end) + 1);
    res.json(group.posts);
});

export default postsRouter;