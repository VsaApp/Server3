import express from 'express';
import db from './db';
import bodyParser from 'body-parser';

const tagsRouter = express.Router();
tagsRouter.use(bodyParser.json());

tagsRouter.get('/:id', (req, res) => {
    const user = (db.get('users') || []).filter((user: any) => user.id == req.params.id)[0];
    res.json(user !== undefined ? user.tags : {});
});

tagsRouter.post('/:id/add', (req, res) => {
    const users = db.get('users') || [];
    let user = users.filter((user: any) => user.id == req.params.id)[0];
    if (user === undefined) {
        users.push({id: req.params.id, tags: {}});
        user = users.filter((user: any) => user.id == req.params.id)[0];
    }
    Object.keys(req.body).forEach((key: string) => {
        user.tags[key] = req.body[key];
    });
    db.set('users', users);
    res.json({'error': null});
});

tagsRouter.post('/:id/remove', (req, res) => {
    const users = db.get('users') || [];
    const user = users.filter((user: any) => user.id == req.params.id)[0];
    if (user === undefined) {
        res.json({'error': 'Invalid id'});
        return;
    }
    req.body.forEach((key: string) => {
        delete user.tags[key];
    });
    db.set('users', users);
    res.json({'error': null});
});

export default tagsRouter;