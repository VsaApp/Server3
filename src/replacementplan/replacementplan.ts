import fs from 'fs';
import path from 'path';
import {saveNewReplacementplan} from '../history/history';
import {fetchData, isNew, parseData, saveData} from './utils';
import {extractData} from './createReplacementplan';
import {getInjectedUnitplan} from './connectWithUnitplan';
import {sendNotifications} from './notifications';
import '../../downloadMyTags';
import {initFirebase} from '../firebase';
import downloadTags from '../../downloadMyTags';
import {informViktoriaApp} from './informViktoriaApp';

const isCli = module.parent === null;
const isDev = process.argv.length >= 3;
const isTest = process.argv.length === 4 && process.argv[3] == '--test';
const updateTags = process.argv.length === 4 && process.argv[3] == '--update';
const replacementPlanPath = process.argv.length === 4 && process.argv[3].endsWith('.html') ? process.argv[3] : undefined;

export const getJson = async (raw: string) => {
    return await extractData(await parseData(raw), isDev);
};

const doWork = async (today: boolean) => {
    const day = (today ? 'today' : 'tomorrow');
    let raw: any;
    if (replacementPlanPath !== undefined) {
        if (!replacementPlanPath.startsWith('http')) raw = fs.readFileSync(replacementPlanPath, 'utf-8').toString();
        else raw = await fetchData(today, replacementPlanPath);
        console.log('Fetched replacement plan for given file');
    }
    else {
        raw = await fetchData(today);
        console.log('Fetched replacement plan for ' + day);
    }
    const data = await parseData(raw);
    console.log('Parsed replacement plan for ' + day);
    if (isNew(raw, today) || isDev) {
        saveNewReplacementplan(raw, []);
        const replacementplan = await extractData(data, isDev);
        console.log('Extracted replacement plan for ' + day);
        replacementplan.forEach(async (data: any) => {
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
        return true;
    }
    return false;
};



const work = async () => {
    if (updateTags) await downloadTags();
    if (!isTest && isCli) {
        await initFirebase();
        const updated1 = await doWork(true);
        let updated2 = false;
        if (replacementPlanPath === undefined) updated2 = await doWork(false);
        if (!isDev && (updated1 || updated2)) informViktoriaApp()
    }
}

work();
