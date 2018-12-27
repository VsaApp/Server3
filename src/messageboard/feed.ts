import crypto from 'crypto';
import express from 'express';
import db from './db';

const feedRouter = express.Router();
feedRouter.post('/:start/:end', (req, res) => {
    if (req.body.groups === undefined) {
        res.json({ error: 'Missing groups' });
        return;
    }
    const groups = db.get('groups') || [];
    const posts = groups.filter((group: { username: string }) => {
        return req.body.groups.includes(group.username);
    }).map((group: { username: string, posts: [] }) => {
        return {
            username: group.username,
            posts: group.posts
        };
    });
    let feed: Array<{ title: string, text: string, id: string, time: string, username: string }> = [];
    posts.forEach((a: { username: string, posts: Array<{ title: string, text: string, id: string, time: string }> }) => {
        a.posts.forEach((post: { title: string, text: string, id: string, time: string }) => {
            feed.push({
                title: post.title,
                text: post.text,
                id: post.id,
                time: post.time,
                username: a.username
            });
        });
    });
    feed = feed.sort((a: { title: string, text: string, id: string, time: string }, b: { title: string, text: string, id: string, time: string }) => {
        return (a.time < b.time) ? 1 : ((a.time > b.time) ? -1 : 0);
    });

    feed = feed.slice(parseInt(req.params.start), parseInt(req.params.end) + 1);
    res.json(feed);
});

export default feedRouter;