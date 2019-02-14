import express from 'express';
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';
import { getCurrentJson, saveNewVersion, getFileName } from './utils';

const historyRouter = express.Router();

historyRouter.get('/:directory', (req, res) => {
    if (req.params.directory != 'replacementplan' && req.params.directory != 'unitplan') {
        res.json({'error': 'Invalid directory'});
        return;
    }
    const result: any = [];
    fs.readdirSync(path.resolve(process.cwd(), 'history', req.params.directory)).forEach((year: string) => {
        result.push({year: year, months: []});
        const yearIndex = result.length - 1;
        fs.readdirSync(path.resolve(process.cwd(), 'history', req.params.directory , year)).forEach((month: string) => {
            result[yearIndex].months.push({month: month, days: []});
            const monthIndex = result[yearIndex].months.length - 1;
            fs.readdirSync(path.resolve(process.cwd(), 'history', req.params.directory, year, month)).forEach((day: string) => {
                result[yearIndex].months[monthIndex].days.push({day: day, files: []});
                const dayIndex = result[yearIndex].months[monthIndex].days.length - 1;
                result[yearIndex].months[monthIndex].days[dayIndex].files = fs.readdirSync(path.resolve(process.cwd(), 'history', req.params.directory, year, month, day));
            });
        });
    });

    res.json(result);
});

historyRouter.get('/:directory/:year/:month/:day/:file', async (req, res) => {
    const directory = req.params.directory;
    const year = req.params.year;
    const month = req.params.month;
    const day = req.params.day;
    const file = req.params.file;

    const filePath = path.resolve(process.cwd(), 'history', directory, year, month, day, file);

    if (!fs.existsSync(filePath)) {
        res.json({'error': 'Invalid path'});
        return;
    }
    if (file.includes('.json')) {
        res.json(await getCurrentJson(filePath.replace('.json', '.html')));
        return;
    }
    else {
        res.send(fs.readFileSync(filePath).toString());
    }
});

export const saveNewReplacementplan = async (raw: string, parsed: any) => {
    try {
        if (parsed.length > 0) {
            const year = parsed[0].for.date.split('.')[2];
            const month = parsed[0].for.date.split('.')[1];
            const day = parsed[0].for.date.split('.')[0];

            saveNewVersion('replacementplan', raw, parsed, year, month, day, getFileName());
        } else {
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

export const saveNewUnitplan = async (rawA: string, rawB: string, parsed: any) => {
    try {
        if (parsed.length > 0) {
            const year = parsed[0].date.split('.')[2].length < 4 ? '20' + parsed[0].date.split('.')[2] : parsed[0].date.split('.')[2];
            const month = parsed[0].date.split('.')[1];
            const day = parsed[0].date.split('.')[0];

            const fileName = getFileName();
            saveNewVersion('unitplan', rawA, [], year, month, day, fileName + 'A');
            saveNewVersion('unitplan', rawB, [], year, month, day, fileName + 'B');
            saveNewVersion('unitplan', '', parsed, year, month, day, fileName);
        } else {
            const data = await parse(rawA);
            const date = data.querySelector('div').childNodes[0].rawText.split(' den ')[1].trim()
            const year = date.split('.')[2].length < 4 ? '20' + date.split('.')[2] : date.split('.')[2];
            const fileName = getFileName();
            saveNewVersion('unitplan', rawA, [], year, date.split('.')[1], date.split('.')[0], fileName + 'A');
            saveNewVersion('unitplan', rawB, [], year, date.split('.')[1], date.split('.')[0], fileName + 'B');
            saveNewVersion('unitplan', '', parsed, year, date.split('.')[1], date.split('.')[0], fileName);
        }
    } catch (e) {
        console.log('Error in history parsing: ' + e.toString());
        const fileName = getFileName();
        saveNewVersion('unitplan', rawA, [], '-', '-', '-', fileName + 'A');
        saveNewVersion('unitplan', rawB, [], '-', '-', '-', fileName + 'B');
        saveNewVersion('unitplan', '', parsed, '-', '-', '-', fileName);
    }
};

export default historyRouter;