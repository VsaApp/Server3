import fs from 'fs';
import path from 'path';
import got from 'got';
import {getJson} from '../replacementplan/replacementplan';

export const getCurrentJson = async (filePath: string) => {
    let raw;
    if (filePath.includes("https://")) raw = (await got(filePath)).body
    else raw = fs.readFileSync(filePath).toString();
    return await getJson(raw);
};

export const saveNewVersion = (directoriy: string, raw: string, data: any, year: string, month: string, day: string, time: string) => {

    // Create all directories...
    const pathSegments = ['history', directoriy, year, month, day];
    for (let i = 0; i < pathSegments.length; i++) {
        let relDir = '';
        for (let j = 0; j <= i; j++) relDir += pathSegments[j] + '/';
        const dir = path.resolve(process.cwd(), relDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    // Create files...
    if (data.length > 0) fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, time + '.json'), JSON.stringify(data, null, 2));
    if (raw !== '') fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, time + '.html'), raw);
};

export const getFileName = () => {
    return Math.round((new Date()).getTime() / 1000).toString();
}

