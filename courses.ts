import fs from 'fs';
import path from 'path';

let stats: any = [];
let files = fs.readdirSync(path.resolve(process.cwd(), 'out', 'unitplan'));
files = files.filter((file: string) => file.length < 8);
files.forEach((file: string) => {
    const grade = file.split('.')[0];
    let reach = 0;
    let got = 0;
    const content = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'unitplan', file), 'utf-8'));
    content.data.forEach((day: any) => {
        Object.keys(day.lessons).forEach((unit: string) => {
            const lesson = day.lessons[unit];
            if (grade === 'EF' || grade === 'Q1' || grade === 'Q2') {
                if (lesson.length === 2) {
                    return;
                }
            } else {
                if (lesson.length === 1) {
                    return;
                }
            }
            lesson.forEach((subject: any) => {
                reach++;
                if (subject.course !== '') {
                    got++;
                }
            });
        });
    });
    stats.push({grade: grade, percent: (got / reach * 100).toFixed(2)});
});

stats = stats.sort((a: any, b: any) => b.percent - a.percent);
stats.forEach((stat: any) => {
    console.log(stat.grade + ' ' + stat.percent + '%');
});