import crypto from 'crypto';
import request from 'request';
import config from '../utils/config';
import { LdapUser } from '../utils/interfaces';
import { runDbCmd, getDbResults } from '../utils/database';
import { getUser } from '../tags/tags_db';

const ldapRequest = (username: string, password: string): Promise<LdapUser> => {
    return new Promise<LdapUser>((resolve, reject) => {
        const options: request.CoreOptions = { auth: { username: username, password: password }, timeout: 1500 };
        try {
            request.get(`${config.ldapUrl}/login`, options, (err, res, body) => {
                if (err) {
                    console.log('Failed to check login:', err);
                    reject();
                } else {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        console.log('Failed to parse login response');
                        reject();
                    }
                }
            });
        } catch (e) {
            console.error('Login request failed:', e);
            reject();
        }
    });
}

const checkLogin = async (username: string, password: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const hashed = crypto.createHash('sha256').update(password).digest('hex');
        ldapRequest(username, password)
            .then((user) => {
                if (user.status) {
                    runDbCmd(`INSERT INTO users_login VALUES (\'${username}\', '${hashed}') ON DUPLICATE KEY UPDATE password = '${hashed}';`);
                } else {
                    runDbCmd(`DELETE FROM users_login WHERE username='${username}';`);
                }
                resolve(user.status);
            })
            .catch(async (_) => {
                const userLogin = (await getDbResults(`SELECT * FROM users_login where username="${username}";`))[0];
                resolve(userLogin ? (userLogin.password === hashed) : false);
            });
    });
}

export const checkUsername = async (username: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const options: request.CoreOptions = { auth: { username: config.ldapUsername, password: config.ldapPassword }, timeout: 1500 };
        try {
            request.get(`${config.ldapUrl}/user/${username}`, options, (err, res, body) => {
                if (err) {
                    console.log('Failed to check username:', err);
                    resolve(true);
                } else {
                    const status = body === 'true';
                    resolve(status);
                }
            });
        } catch (_) {
            resolve(true);
        }
    });
}

export const getGrade = async (username: string, password: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        ldapRequest(username, password)
            .then((user) => {
                resolve(user.grade);
            })
            .catch(async (_) => {
                const user = await getUser(username)
                if (user) {
                    resolve(user.username);
                } else {
                    resolve('');
                }
            });
    });
}

export default checkLogin;