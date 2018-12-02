import fs from 'fs';
import path from 'path';
import config from '../config';
import got from 'got';
import { parse } from 'node-html-parser';

const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2'];
const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

const fetchData = async () => {
    return (await got('https://www.viktoriaschule-aachen.de/sundvplan/sps/left.html', { auth: config.username + ':' + config.password })).body;
};

const parseData = async (raw: string) => {
    return await parse(raw);
};

const extractData = async (data: any) => {
    return await grades.map(grade => {
        let d: any = weekdays.map((weekday: string) => {
            return { weekday: weekday, lessons: {} };
        });
        data.querySelectorAll('table')[grades.indexOf(grade)].childNodes.slice(1).forEach((row: any, unit: number) => {
            row.childNodes.slice(1).forEach((field: any, day: number) => {
                const a: any = field.childNodes.map((a: any) => a.childNodes[0].rawText.trim().replace(/ +(?= )/g, '')).filter((a: string, i: number) => a != '' || i == 5);
                if (a.length > 0) {
                    if (d[day].lessons[unit] === undefined) {
                        d[day].lessons[unit] = [];
                    }
                    if (a.length === 1) {
                        d[day].lessons[unit].push({ block: '', participant: a[0].split(' ')[0], subject: a[0].split(' ')[1], room: a[0].split(' ')[2].toUpperCase() });
                    } else {
                        for (let i = 1; i < a.length; i++) {
                            d[day].lessons[unit].push({ block: a[0].split(' ')[1], participant: a[i].split(' ')[1], subject: a[i].split(' ')[0], room: a[i].split(' ')[2].toUpperCase() });
                        }
                    }
                }
            });
        });
        d = d.map((a: any) => {
            if (Object.keys(a.lessons).length >= 6) {
                a.lessons['5'] = { block: '', participant: '', subject: 'Mittagspause', room: '' };
            }
            return a;
        });
        return {
            grade: grade,
            date: data.querySelector('div').childNodes[0].rawText.split(' den ')[1].trim(),
            data: d
        };
    });
};

(async () => {
    fetchData().then(raw => {
        console.log('Fetched unit plan');
        parseData(raw).then(data => {
            console.log('Parsed unit plan');
            extractData(data).then(unitplan => {
                console.log('Extracted unit plan');
                unitplan.forEach(data => {
                    fs.writeFileSync(path.resolve(process.cwd(), 'out', 'unitplan', data.grade + '.json'), JSON.stringify(data, null, 2));
                });
                console.log('Saved unit plan');
            });
        });
    });
})();
