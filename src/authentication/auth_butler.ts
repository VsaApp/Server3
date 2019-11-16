import checkLogin from './ldap';
import express from 'express';

export const authRouter = express.Router();

authRouter.get('/', (req, res) => {
    return res.json({status: true});
});

authRouter.get('/:username/:password', async (req, res) => {
    const status = await checkLogin(req.params.username, req.params.password);
    return res.json({status: status});
});

function authorizer(username: string, password: string) {
    return checkLogin(username, password);
}

export default authorizer;