import fs from 'fs';
import path from 'path';
import {resetOldChanges, setChangesInUnitplan} from './src/replacementplan/connectWithUnitplan';
import {getCurrentJson} from './src/history/history';
import {weekdayToInt} from './src/replacementplan/utils'

// Logs help info
if (process.argv.length > 2 && (process.argv[2].includes('h') || process.argv[2].includes('help'))) {
    console.log('fillInCourses.ts                     -> for all replacementplans');
    console.log('fillInCourses.ts  1.1.2000           -> for all replacementplans since given date (includes start date)');
    console.log('fillInCourses.ts  1.1.2000 1.6.2000  -> for all replacementplans between given dates (includes dates)');
    process.exit();
}

const startDate = [0, 0, 0];
const endDate = [10000, 100, 100];

if (process.argv.length > 2) {
    startDate[0] = parseInt(process.argv[2].split('.')[2]);
    startDate[1] = parseInt(process.argv[2].split('.')[1]);
    startDate[2] = parseInt(process.argv[2].split('.')[0]);
}

if (process.argv.length > 3) {
    endDate[0] = parseInt(process.argv[3].split('.')[2]);
    endDate[1] = parseInt(process.argv[3].split('.')[1]);
    endDate[2] = parseInt(process.argv[3].split('.')[0]);
}

// Create all unitplans for each replacementplan version in the given range
const allFiles: string[] = [];
fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan')).forEach((year: string) => {
    if (parseInt(year) >= startDate[0] && parseInt(year) <= endDate[0]) {
        fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year)).forEach((month: string) => {
            if (parseInt(month) >= startDate[1] && parseInt(month) <= endDate[1]) {
                fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year, month)).forEach((day: string) => {
                    if (parseInt(day) >= startDate[2] && parseInt(day) <= endDate[2]) {
                        fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year, month, day)).filter((file: string) => file.endsWith('.html')).forEach((file: string) => {
                            const filePath = path.resolve(process.cwd(), 'history', 'replacementplan', year, month, day, file);
                            allFiles.push(filePath);
                        });
                    }
                });
            }
        });
    }
});

const getUnitplan = (grade: string): any => {
    return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'unitplan', grade + '.json')).toString());
};

const doWork = async () => {
    // Get all unitplans...
    const allUnitplans: any = {};
    for (let i = 0; i < allFiles.length; i++) {
        const parsed = await getCurrentJson(allFiles[i]);
        parsed.forEach((replacementplan: any) => {
            const grade = replacementplan.participant;
            if (allUnitplans[grade] === undefined) allUnitplans[grade] = getUnitplan(grade);

            // Create unitplan
            const unitplan = getUnitplan(grade);
            resetOldChanges(unitplan);
            setChangesInUnitplan(grade, unitplan, replacementplan);


            unitplan.data.forEach((day: any) => {
                const weekday = weekdayToInt(day.weekday);
                Object.keys(day.lessons).forEach((unit: string) => {
                    const lesson = day.lessons[unit];
                    lesson.forEach((subject: any) => {
                        if (subject.course !== "") {
                            allUnitplans[grade].data[weekday].lessons[unit][lesson.indexOf(subject)].course = subject.course;
                        }
                    });
                });
            });
        });
    }

    Object.keys(allUnitplans).forEach((grade: string) => {
        fs.writeFileSync(path.resolve(process.cwd(), 'out', 'unitplan', grade + '.json'), JSON.stringify(allUnitplans[grade], null, 2));
    });

    // Get all injected unitplans...
};

doWork();
