import express from 'express';
import db from './db';

const groupsRouter = express.Router();

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
    groups.push({
        username: req.body.username,
        password: req.body.password,
        info: req.body.info,
        status: 'waiting',
        follower: -1,
        posts: []
    });
    db.set('groups', groups);
    res.json({ error: null });
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
});

export default groupsRouter;