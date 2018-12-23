import crypto from 'crypto';
import express from 'express';
import db from './db';

const postsRouter = express.Router();
postsRouter.post('/add/:username/:password', (req, res) => {
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
    const id = crypto.randomBytes(8).toString('hex');
    const time = new Date().toISOString();
    group.posts.push({
        title: req.body.title,
        text: req.body.text,
        id,
        time
    });
    db.set('groups', groups);
    res.json({ error: null, id, time });
});

postsRouter.get('/list/:username', (req, res) => {
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
    res.json(group.posts);
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