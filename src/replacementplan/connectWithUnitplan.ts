import fs from 'fs';
import path from 'path';
import {weekdayToInt} from './utils';

export const getInjectedUnitplan = (grade: string) => {
    const unitplan = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'unitplan', grade + '.json')).toString());
    let replacementplan1: any = {};
    try {
        replacementplan1 = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'today', grade + '.json')).toString());
    } catch (e) {

    }
    let replacementplan2: any = {};
    try {
        replacementplan2 = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'tomorrow', grade + '.json')).toString());
    } catch (e) {

    }

    resetOldChanges(unitplan);
    setChangesInUntiplan(grade, unitplan, replacementplan1);
    setChangesInUntiplan(grade, unitplan, replacementplan2);

    return unitplan;
};

export const resetOldChanges = (unitplan: any) => {
    // Reset old replacementplan data
    unitplan.data = unitplan.data.map((day: any) => {
        Object.keys(day.lessons).forEach((unit: string) => {
            day.lessons[unit] = day.lessons[unit].map((subject: any) => {
                subject.changes = [];
                return subject;
            });
            return day.lessons[unit];
        });
        day.replacementplan = {
            for: {
                date: '',
                weekday: ''
            },
            updated: {
                date: '',
                time: ''
            }
        };
        return day;
    });
};

export const setChangesInUntiplan = (grade: string, unitplan: any, replacementplan: any) => {

    // Convert weekday strings to numbers
    replacementplan.data = replacementplan.data.map((change: any) => {
        change.weekday = weekdayToInt(replacementplan.for.weekday);
        return change;
    });

    // Set new replacementplan dates
    if (replacementplan.data !== undefined) {
        unitplan.data[weekdayToInt(replacementplan.for.weekday)].replacementplan = {
            for: {
                date: replacementplan.for.date,
                weekday: replacementplan.for.weekday
            },
            updated: {
                date: replacementplan.updated.date,
                time: replacementplan.updated.time
            }
        };
    }

    // Add new replacementplan changes
    replacementplan.data.forEach((change: any) => {
        // Get normal subjects in the lesson of the change
        const subjects = unitplan.data[change.weekday].lessons[change.unit.toString()];
        change.sure = false;
        change.exam = change.change.info.toLowerCase().includes('klausur');
        change.rewriteExam = change.change.info.toLowerCase().includes('nachschreiber');
        if (change.exam) {
            change.sure = !change.rewriteExam;
            subjects.forEach((subject: any) => {
                subject.changes.push(change);
            });
        } else {
            let duplicates;
            duplicates = subjects.filter((subject: any) => subject.subject === change.subject);
            // If there is only one subject with the correct name, add change to it
            if (duplicates.length === 1) {
                change.sure = true;
                duplicates[0].changes.push(change);
            } else if (subjects.filter((subject: any) => subject.room === change.room).length === 1) {
                change.sure = true;
                const subject = subjects.filter((subject: any) => subject.room === change.room)[0];
                subject.changes.push(change);
            } else if (subjects.filter((subject: any) => subject.subject + '-' + subject.course === change.subject + '-' + change.course).length === 1) {
                change.sure = true;
                const subject = subjects.filter((subject: any) => subject.subject + '-' + subject.course === change.subject + '-' + change.course)[0];
                subject.changes.push(change);
            } else if (duplicates.filter((duplicate: any) => duplicate.course === '').length === 1) {
                change.sure = true;
                const subject = duplicates.filter((duplicate: any) => duplicate.course === '')[0];
                subject.changes.push(change);
            }
            if (!change.sure) {
                if (duplicates.length === 0) {
                    subjects.forEach((subject: any) => {
                        subject.changes.push(change);
                    });
                } else {
                    duplicates.forEach((subject: any) => {
                        subject.changes.push(change);
                    });
                }

            }
        }
        subjects.forEach((subject: any) => {
            subject.changes.forEach((subject: any) => {
                delete subject['weekday'];
            });
            subject.changes.filter((change: any) => change.sure && !change.exam && !change.rewriteExam).forEach((change: any) => {
                if (change.participant === '') {
                    change.participant = subject.participant;
                }
                if (change.room === '') {
                    change.room = subject.room;
                }
                if (change.course === '' && subject.course !== '') {
                    change.course = subject.course;
                }
                if (subject.course === '' && change.course !== '') {
                    subject.course = change.course;
                }
            });
        });
        if (!change.sure && change.change.info !== 'Klausurnachschreiber') {
            //console.log(grade, change, subjects, route);
        }
    });
};
