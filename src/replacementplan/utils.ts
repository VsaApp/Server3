import path from 'path';
import fs from 'fs';
import {parse} from 'node-html-parser';
import got from 'got';
import config from '../config';

export const isNew = (data: any, today: boolean) => {
    const file = path.resolve(process.cwd(), 'out', 'replacementplan', (today ? 'today' : 'tomorrow') + '.txt');
    let old = '';
    if (fs.existsSync(file)) {
        old = fs.readFileSync(file, 'utf-8').toString();
    }
    try {
        return old !== data.querySelectorAll('div')[1].childNodes[0].rawText;
    } catch (e) {
        console.log('Cannot get new date: ' + e.toString());
        return false;
    }
};

export const saveDate = (data: any, today: boolean) => {
    const file = path.resolve(process.cwd(), 'out', 'replacementplan', (today ? 'today' : 'tomorrow') + '.txt');
    fs.writeFileSync(file, data.querySelectorAll('div')[1].childNodes[0].rawText);
};

export const fetchData = async (today: boolean) => {
    return (await got('https://www.viktoriaschule-aachen.de/sundvplan/vps/' + (today ? 'left' : 'right') + '.html', {auth: config.username + ':' + config.password})).body;
};

export const parseData = async (raw: string) => {
    return await parse(raw);
};

export const weekdayToInt = (weekday: string): number => {
    return ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].indexOf(weekday);
};
export const intToWeekday = (weekday: number): string => {
    return ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][weekday];
};

