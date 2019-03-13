import express from 'express';
import db from './db';
import bodyParser from 'body-parser';

const tagsRouter = express.Router();
tagsRouter.use(bodyParser.json());

export const getUser = (id: string) => {
    const isOneSignalId = id.split('-').length === 5 && id.length === 36;
    let user = (db.get(isOneSignalId ? 'users' : 'devices') || []).filter((user: any) => user.id == id)[0];
    if (user === undefined && isOneSignalId) user = (db.get('devices') || []).filter((user: any) => user.tags.onesignalId == id)[0];
    return user;
}

tagsRouter.get('/:id', (req, res) => {
    const user = getUser(req.params.id);
    res.json(user !== undefined ? user.tags : {});
});

tagsRouter.post('/:id/add', (req, res) => {
    console.log(req.params.id, req.body);
    const isOneSignalId = req.params.id.split('-').length === 5 && req.params.id.length === 36;
    const devices = db.get('devices') || [];
    const users = db.get('users') || [];
    let user: any;
    if (isOneSignalId) {
        user = users.filter((user: any) => user.id == req.params.id)[0];
        if (user === undefined) {
            users.push({id: req.params.id, tags: {}});
            user = users.filter((user: any) => user.id == req.params.id)[0];
        }
    } else {
        user = devices.filter((user: any) => user.id == req.params.id)[0];
        if (user === undefined) {
            const oldUser = users.filter((user: any) => user.id === req.body.onesignalId)[0];
            let oldTags: any = {};
            if (oldUser !== undefined) {
                delete users[users.indexOf(oldUser)];
                oldTags = oldUser.tags;
            }
            devices.push({id: req.params.id, tags: oldTags});
            user = devices.filter((user: any) => user.id == req.params.id)[0];
        }
        else if (req.body.onesignalId !== undefined) {
            const oldUser = users.filter((user: any) => user.id === req.body.onesignalId)[0];
            if (oldUser !== undefined) delete users[users.indexOf(oldUser)];
        }
    }
    Object.keys(req.body).forEach((key: string) => {
        user.tags[key] = req.body[key];
    });
    db.set('users', users.filter((user: any) => user !== undefined));
    db.set('devices', devices);
    res.json({'error': null});
});

tagsRouter.post('/:id/remove', (req, res) => {
    const isOneSignalId = req.params.id.split('-').length === 5 && req.params.id.length === 36;
    const users = db.get(isOneSignalId ? 'users' : 'devices') || [];
    const user = users.filter((user: any) => user.id == req.params.id)[0];
    if (user === undefined) {
        res.json({'error': 'Invalid id'});
        return;
    }
    req.body.forEach((key: string) => {
        delete user.tags[key];
    });
    db.set(isOneSignalId ? 'users' : 'devices', users);
    res.json({'error': null});
});

export default tagsRouter;