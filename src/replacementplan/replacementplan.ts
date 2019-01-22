import fs from 'fs';
import path from 'path';
import {saveNewReplacementplan} from '../history/history';
import {fetchData, parseData, isNew, saveDate} from './utils';
import {extractData, createTeacherReplacementplan} from './createReplacementplan';
import {updateUnitPlan, getInjectedUnitplan} from './connectWithUntiplan';
import {sendNotifications} from './notifications';

const isDev = process.argv.length === 3;
const isTest = process.argv.length === 4;

export const getJson = async (raw: string) => {
    const data = await parseData(raw);
    const replacementplan1 = await extractData(data);
    const replacementplan2 = await createTeacherReplacementplan(replacementplan1);
    return replacementplan1.concat(replacementplan2);
};

const doWork = async (today: boolean) => {
    const day = (today ? 'today' : 'tomorrow');
    const raw = await fetchData(today);
    console.log('Fetched replacement plan for ' + day);
    const data = await parseData(raw);
    console.log('Parsed replacement plan for ' + day);
    if (isNew(data, today) || isDev) {
        saveNewReplacementplan(raw, []);
        const replacementplan1 = await extractData(data);
        const replacementplan2 = await createTeacherReplacementplan(replacementplan1);
        console.log('Extracted replacement plan for ' + day);
        replacementplan1.concat(replacementplan2).forEach(async (data) => {
            if (data.participant.length < 3) {
                updateUnitPlan(data);
            }
            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', day, data.participant + '.json'), JSON.stringify(data, null, 2));
        });
        saveNewReplacementplan('', replacementplan1.concat(replacementplan2));
        saveDate(data, today);
        console.log('Saved replacement plan for ' + day + ' for ' + day);

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
            unitplans[grade + '-today'] = getInjectedUnitplan(true, grade);
            unitplans[grade + '-tomorrow'] = getInjectedUnitplan(false, grade);
        });

        await sendNotifications(isDev, today, data, replacementplan1, unitplans);
    }
};

if (!isTest) {
    doWork(true);
    doWork(false);
}
