import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import ldap from 'ldapjs';
import config from '../utils/config';
import { rejects } from 'assert';

let client: ldap.Client | undefined = undefined;

// ldapjs information: http://ldapjs.org/client.html

export const initLdap = () => {
    client = ldap.createClient({
        url: config.ldapUrl,
        timeout: 4000
    });
}

const checkLogin = async (username: string, password: string): Promise<boolean> => {
    // Try to bind with given username and password
    const success: boolean = await new Promise<boolean>((resolve, reject) => {
        if (client) {
            client.bind(`cn=${username}`, password, (res, err) => reject(res));
        }
        else throw "ldap must be initialized";
    });
    // If bind successfully, unbind
    if (client && success) client.unbind();
    return success;
}

// TODO: implement with ldapjs
export const checkUsername = async (username: string): Promise<boolean> => {
    const users = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'ldap.json')).toString());
    return users[username] !== undefined;
}

export const getGrade = async (username: string, password: string): Promise<string> => {
    const users = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'ldap.json')).toString());
    return (users[username] || {grade: ''}).grade;
}

export default checkLogin;