import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import {getUsers} from './src/tags/users';
import config from'./src/config';

const versionsRouter = express.Router();
versionsRouter.use(bodyParser.json());

versionsRouter.get('/', async (req, res) => {
    const users = getUsers();
    let htmlString = '<h1>App Versions</h1><h2>Without undef.</h2><p>';
    let countNotUndef = 0;
    const allAppVersions: any = {};
    const appVersionsWithoutUndef: any = {};
    users.forEach((user: any) => {
        const version = user.tags.appVersion === undefined ? 'undef.' : user.tags.appVersion;
        if (allAppVersions[version] === undefined) allAppVersions[version] = 0;
        if (version !== 'undef.'){
            if (appVersionsWithoutUndef[version] === undefined) appVersionsWithoutUndef[version] = 0;
            appVersionsWithoutUndef[version]++;
            countNotUndef++;
        }
        allAppVersions[version]++;
    });
    
    htmlString += getVersions(appVersionsWithoutUndef, countNotUndef);
    htmlString += '</p><h2>With undef.</h2><p>';
    htmlString += getVersions(allAppVersions, users.length);
    htmlString += '</p>';

    res.send(htmlString);
});

export const getVerionsList = () => {
    const users = getUsers();
    const appVersions: any = {};
    users.forEach((user: any) => {
        const version = user.tags.appVersion;
        if (version !== undefined){
            if (appVersions[version] === undefined) appVersions[version] = 0;
            appVersions[version]++;
        }
    });
    const result: any = {};
    Object.keys(appVersions).sort((v1: string, v2: string) => {
        const v1Code = parseInt(v1.split('+')[1]);
        const v2Code = parseInt(v2.split('+')[1]);
        return v1Code < v2Code ? 1 : v1Code > v2Code ? -1 : 0;
    }).forEach((version) => {
        result[version] = appVersions[version];
    });
    return result;
}

const getVersions = (appVersions: any, length: number) => {
    let htmlString = '';
    Object.keys(appVersions).sort((v1: string, v2: string) => {
        const v1Code = parseInt(v1.split('+')[1]);
        const v2Code = parseInt(v2.split('+')[1]);
        if (v1 === 'undef.') return 1;
        if (v2 === 'undef.') return -1;
        return v1Code < v2Code ? 1 : v1Code > v2Code ? -1 : 0;
    }).forEach((version: string) => {
        htmlString += `${version}: ${(appVersions[version] * 100 / length).toFixed(1)}% (${appVersions[version]}/${length})<br>`;
    });

    return htmlString;
}


export default versionsRouter;