import express from 'express';
import config from './config';

const app = express();

app.get('/login/:username/:password', (req, res) => {
    if (req.params.username.toLowerCase() === config.usernamesha && req.params.password.toLowerCase() === config.passwordsha) {
        return res.json({ status: true });
    }
    res.json({ status: false });
});

app.listen(process.env.PORT || 8000, () => {
    console.log('Listening on port ' + (process.env.PORT || 8000));
});