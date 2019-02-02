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
    replacementplan1.data = replacementplan1.data.map((change: any) => {
        change.weekday = weekdayToInt(replacementplan1.for.weekday);
        return change;
    });
    replacementplan2.data = replacementplan2.data.map((change: any) => {
        change.weekday = weekdayToInt(replacementplan2.for.weekday);
        return change;
    });
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
    if (replacementplan1.data !== undefined) {
        unitplan.data[weekdayToInt(replacementplan1.for.weekday)].replacementplan = {
            for: {
                date: replacementplan1.for.date,
                weekday: replacementplan1.for.weekday
            },
            updated: {
                date: replacementplan1.updated.date,
                time: replacementplan1.updated.time
            }
        };
    }
    if (replacementplan2.data !== undefined) {
        unitplan.data[weekdayToInt(replacementplan2.for.weekday)].replacementplan = {
            for: {
                date: replacementplan2.for.date,
                weekday: replacementplan2.for.weekday
            },
            updated: {
                date: replacementplan2.updated.date,
                time: replacementplan2.updated.time
            }
        };
    }
    replacementplan1.data.concat(replacementplan2.data).forEach((change: any) => {
            const subjects = unitplan.data[change.weekday].lessons[change.unit.toString()];
            change.sure = false;
            change.exam = change.change.info.toLowerCase().includes('klausur');
            change.rewriteExam = change.change.info.toLowerCase().includes('nachschreiber');
            if (change.exam) {
                change.sure = !change.change.info.toLowerCase().includes('nachschreiber');
                subjects.forEach((subject: any) => {
                    subject.changes.push(change);
                });
            } else {
                let duplicates;
                duplicates = subjects.filter((subject: any) => subject.subject === change.subject);
                if (duplicates.length === 1) {
                    change.sure = true;
                    duplicates.forEach((subject: any) => {
                        subject.changes.push(change);
                    });
                } else {
                    if (subjects.filter((subject: any) => subject.room === change.room).length === 1) {
                        change.sure = true;
                        const subject = subjects.filter((subject: any) => subject.room === change.room)[0];
                        subject.changes.push(change);
                    }
                    if (!change.sure) {
                        if (duplicates.length === 0) {
                            subjects.forEach((subject: any) => {
                                subject.changes.push(change);
                            });
                        } else {
                            subjects
                                .filter((subject: any) => subject.subject === change.subject)
                                .forEach((subject: any) => {
                                    subject.changes.push(change);
                                });
                        }
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
                console.log(grade, change, subjects);
            }
        }
    );
    return unitplan;
};
