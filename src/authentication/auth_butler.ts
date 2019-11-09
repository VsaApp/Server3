import checkLogin from './ldap';
import express from 'express';

export const authRouter = express.Router();

authRouter.get('/:username/:password', (req, res) => {
    const status = checkLogin(req.params.username, req.params.password);
    return res.json({status: status});
});

function authorizer(username: string, password: string) {
    return checkLogin(username, password);
}

export default authorizer;