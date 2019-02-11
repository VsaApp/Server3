import fs from 'fs';
import path from 'path';
import {resetOldChanges, setChangesInUnitplan} from './src/replacementplan/connectWithUnitplan';
import {getCurrentJson} from './src/history/utils';
import {weekdayToInt} from './src/replacementplan/utils'

const startDate = new Date(1, 1, 1);
const endDate = new Date(3000, 1, 1);
let days = 0;

process.argv.forEach((arg: string, index: number) => {
    if (arg.startsWith('--start:')) {
        const date = arg.split(':')[1];
        startDate.setFullYear(parseInt(date.split('.')[2]));
        startDate.setUTCMonth(parseInt(date.split('.')[1]) - 2);
        startDate.setDate(parseInt(date.split('.')[0]));
        console.log("from " + startDate.toDateString());
    }
    else if (arg.startsWith('--end:')) {
        const date = arg.split(':')[1];
        endDate.setFullYear(parseInt(date.split('.')[2]));
        endDate.setUTCMonth(parseInt(date.split('.')[1]) - 2);
        endDate.setDate(parseInt(date.split('.')[0]));
        console.log("to " + endDate.toDateString());
    }
    else if (arg.includes('h')) {
        console.log('fillInCourses.ts                                   -> for all replacementplans');
        console.log('fillInCourses.ts  --start:1.1.2000                 -> for all replacementplans since given date (includes start date)');
        console.log('fillInCourses.ts  --start:1.1.2000 --end:1.6.2000  -> for all replacementplans between given dates (includes dates)');
        process.exit();
    }
});

// Create all unitplans for each replacementplan version in the given range
const allFiles: string[] = [];
fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan')).forEach((year: string) => {
    fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year)).forEach((month: string) => {
        fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year, month)).forEach((day: string) => {
            if (startDate.getTime() <= new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime() && 
                endDate.getTime() >= new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime()) {
                days++;

                fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year, month, day)).filter((file: string) => file.endsWith('.html')).forEach((file: string) => {
                    const filePath = path.resolve(process.cwd(), 'history', 'replacementplan', year, month, day, file);
                    allFiles.push(filePath);
                });
            }
        });
    });
});

const getUnitplan = (grade: string): any => {
    return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'unitplan', grade + '.json')).toString());
};

const doWork = async () => {
    // Get all unitplans...
    const allUnitplans: any = {};
    console.log(`Load ${allFiles.length} replacementplan versions (${days} days)`);
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
