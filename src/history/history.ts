import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import {getJson} from '../replacementplan/replacementplan';

export const getCurrentJson = async (filePath: string) => {
    const raw = fs.readFileSync(filePath).toString();
    return await getJson(raw);
};

const saveNewVersion = (directoriy: string, raw: string, data: any, year: string, month: string, day: string, time: string) => {
    
    // Create all directories...
    const pathSegments = ['history', directoriy, year, month, day];
    for (let i = 0; i < pathSegments.length; i++){
        let relDir = '';
        for(let j = 0; j <= i; j++) relDir += pathSegments[j] + '/';
        const dir = path.resolve(process.cwd(), relDir);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    }

    // Create files...
    if (data.length > 0) fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, time + '.json'), JSON.stringify(data, null, 2));
    if (raw !== '') fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, time + '.html'), raw);
};

const getFileName = () => {
    return Math.round((new Date()).getTime() / 1000).toString();
}

export const saveNewReplacementplan = async (raw: string, parsed: any) => {
    try {
        if (parsed.length > 0) {
            const year = parsed[0].for.date.split('.')[2];
            const month = parsed[0].for.date.split('.')[1];
            const day = parsed[0].for.date.split('.')[0];

            saveNewVersion('replacementplan', raw, parsed, year, month, day, getFileName());
        }
        else {
            const data = await parse(raw);
            const dateStr = data.querySelectorAll('div')[0].childNodes[0].rawText.substr(1).replace('-Klassen-Vertretungsplan für ', '').replace('Januar', 'January').replace('Februar', 'February').replace('März', 'March').replace('Mai', 'May').replace('Juni', 'June').replace('Juli', 'July').replace('Oktober', 'October').replace('Dezember', 'December');
            const date = new Date(dateStr);
            date.setHours(date.getHours() + 1);
            saveNewVersion('replacementplan', raw, parsed, date.getUTCFullYear().toString(), (date.getUTCMonth() + 1).toString(), date.getUTCDate().toString(), getFileName());
        }
    } catch (e) {
        console.log('Error in history parsing: ' + e.toString());
        saveNewVersion('replacementplan', raw, parsed, '-', '-', '-', getFileName());
    }
};

export const saveNewUnitplan = async (raw: string, parsed: any) => {
    try {
        if (parsed.length > 0) {
            const year = parsed[0].date.split('.')[2].length < 4 ? '20' + parsed[0].date.split('.')[2] : parsed[0].date.split('.')[2];
            const month = parsed[0].date.split('.')[1];
            const day = parsed[0].date.split('.')[0];
        
            saveNewVersion('unitplan', raw, parsed, year, month, day, getFileName());
        }
        else {
            const data = await parse(raw);
            const date = data.querySelector('div').childNodes[0].rawText.split(' den ')[1].trim()
            const year = date.split('.')[2].length < 4 ? '20' + date.split('.')[2] : date.split('.')[2];
            saveNewVersion('unitplan', raw, parsed, year, date.split('.')[1], date.split('.')[0], getFileName());
        }
    } catch (e) {
        console.log('Error in history parsing: ' + e.toString());
        saveNewVersion('unitplan', raw, parsed, '-', '-', '-', getFileName());
    }
};