import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import request from 'request';
import config from '../utils/config';
import { LdapUser } from '../utils/interfaces';

const ldapRequest = (username: string, password: string): Promise<LdapUser> => {
    return new Promise<LdapUser>((resolve, reject) => {
        const options: request.CoreOptions = { auth: { username: username, password: password } };
        request.get(`${config.ldapUrl}/login`, options, (err, res, body) => {
            if (err) {
                console.log('Failed to check login:', err);
                resolve({ status: false, grade: '', isTeacher: false });
            } else {
                resolve(JSON.parse(body));
            }
        });
    });
}

const checkLogin = async (username: string, password: string): Promise<boolean> => {
    const user = await ldapRequest(username, password);
    return user.status;
}

export const checkUsername = async (username: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const options: request.CoreOptions = { auth: { username: config.ldapUsername, password: config.ldapPassword } };
        request.get(`${config.ldapUrl}/user/${username}`, options, (err, res, body) => {
            if (err) {
                console.log('Failed to check username:', err);
                resolve(false);
            } else {
                const status = body === 'true';
                resolve(status);
            }
        });
    });
}

export const getGrade = async (username: string, password: string): Promise<string> => {
    return (await ldapRequest(username, password)).grade;
}

export default checkLogin;