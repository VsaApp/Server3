import express from 'express';
import config from './config';
import { fetchData, parseData, extractData, fetchDataForUser } from './cafetoria/cafetoria';

const app = express();

app.get('/login/:username/:password', (req, res) => {
    if (req.params.username.toLowerCase() === config.usernamesha && req.params.password.toLowerCase() === config.passwordsha) {
        return res.json({ status: true });
    }
    res.json({ status: false });
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

app.listen(process.env.PORT || 8000, () => {
    console.log('Listening on port ' + (process.env.PORT || 8000));
});