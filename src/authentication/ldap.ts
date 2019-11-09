import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const checkLogin = (username: string, password: string): boolean => {
    const users = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'ldap.json')).toString());
    const passwordSha = crypto.createHash('sha256').update(password).digest('hex');
    return users[username].password === passwordSha;
}

export const getGrade = (username: string, password: string): string => {
    const users = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'ldap.json')).toString());
    return (users[username] || {grade: ''}).grade;
}

export default checkLogin;