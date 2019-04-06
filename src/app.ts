import express from 'express';
import cors from 'cors';
import config from './config';
import {fetchDataForUser} from './cafetoria/cafetoria';
import {subjects} from './subjects';
import {rooms} from './rooms';
import router from './messageboard/messageboard';
import tagsRouter from './tags/tags';
import changesRouter from './changes/changes';
import historyRouter from './history/history';
import bugsRouter from './bugs/bugs';
import versionsRouter from '../versions';
import fs from 'fs';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.get('/login/:username/:password', (req, res) => {
    if (req.params.username.toLowerCase() === config.usernamesha && req.params.password.toLowerCase() === config.passwordsha) {
        return res.json({status: true});
    }
    res.json({status: false});
});

app.get('/updates', (req, res) => {
    const files: any = {
        'out/cafetoria/date.txt': 'cafetoria',
        'out/calendar/date.txt': 'calendar',
        'out/replacementplan/today.html': 'replacementplantoday',
        'out/replacementplan/tomorrow.html': 'replacementplantomorrow',
        'out/teachers/date.txt': 'teachers',
        'out/unitplan/date.txt': 'unitplan',
        'out/workgroups/date.txt': 'workgroups',
    };
    const data: any = {
        'subjectsDef': '1',
        'roomsDef': '1',
        'teachersDef': '1',
	'app': '10',
    };
    Object.keys(files).forEach((file: string) => {
        data[files[file]] = fs.statSync(file).mtime;
    });
    res.send(data);
});

app.get('/cafetoria/login/:id/:pin', async (req, res) => {
    if (req.params.id === 'null' || req.params.pin === 'null' || req.params.id === undefined || req.params.pin === undefined) {
        req.params.id = '';
        req.params.pin = '';
    }
    try {
        res.json(await fetchDataForUser(req.params.id, req.params.pin));
    } catch (e) {
        res.json(e);
    }
});

app.get('/subjects', (req, res) => {
    res.json(subjects);
});

app.get('/rooms', (req, res) => {
    res.json(rooms);
});

app.use('/messageboard', router);
app.use('/tags', tagsRouter);
app.use('/changes', changesRouter);
app.use('/history', historyRouter);
app.use('/bugs', bugsRouter);
app.use('/versions', versionsRouter);

export default app;
