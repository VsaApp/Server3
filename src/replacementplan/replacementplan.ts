import fs from 'fs';
import path from 'path';
import {saveNewReplacementplan} from '../history/history';
import {fetchData, isNew, parseData, saveData} from './utils';
import {extractData} from './createReplacementplan';
import {getInjectedUnitplan} from './connectWithUnitplan';
import {sendNotifications} from './notifications';

const isCli = module.parent === null;
const isDev = process.argv.length === 3;
const isTest = process.argv.length === 4;

export const getJson = async (raw: string) => {
    return await extractData(await parseData(raw));
};

const doWork = async (today: boolean) => {
    const day = (today ? 'today' : 'tomorrow');
    const raw = await fetchData(today);
    console.log('Fetched replacement plan for ' + day);
    const data = await parseData(raw);
    console.log('Parsed replacement plan for ' + day);
    if (isNew(raw, today) || isDev) {
        saveNewReplacementplan(raw, []);
        const replacementplan = await extractData(data);
        console.log('Extracted replacement plan for ' + day);
        replacementplan.forEach(async (data) => {
            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', day, data.participant + '.json'), JSON.stringify(data, null, 2));
        });
        saveNewReplacementplan('', replacementplan);
        saveData(raw, today);
        console.log('Saved replacement plan for ' + day);

        // Get all grades
        const grades = [];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                grades.push((5 + i) + (j === 0 ? 'a' : (j === 1 ? 'b' : 'c')));
            }
        }
        grades.push('EF');
        grades.push('Q1');
        grades.push('Q2');

        const unitplans: any = {};

        grades.forEach((grade: string) => {
            unitplans[grade] = getInjectedUnitplan(grade);

            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'unitplan', grade + '.json'), JSON.stringify(unitplans[grade], null, 2));
        });

        await sendNotifications(isDev, today, data, replacementplan, unitplans);
    }
};

if (!isTest && isCli) {
    doWork(true);
    doWork(false);
}
