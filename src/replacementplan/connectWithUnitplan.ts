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
    if (replacementplan1.for !== undefined && replacementplan2.for !== undefined && replacementplan1.for.date === replacementplan2.for.date) {
        const updated1 = replacementplan1.updated;
        const date1 = new Date(
            parseInt(updated1.date.split('.')[2]) + 2000,
            parseInt(updated1.date.split('.')[1]) - 1,
            parseInt(updated1.date.split('.')[0]),
            parseInt(updated1.time.split(':')[0]),
            parseInt(updated1.time.split(':')[1])
        );
        const updated2 = replacementplan1.updated;
        const date2 = new Date(
            parseInt(updated2.date.split('.')[2]) + 2000,
            parseInt(updated2.date.split('.')[1]) - 1,
            parseInt(updated2.date.split('.')[0]),
            parseInt(updated2.time.split(':')[0]),
            parseInt(updated2.time.split(':')[1])
        );
        setChangesInUnitplan(grade, unitplan, date1.getTime() > date2.getTime() ? replacementplan1 : replacementplan2);
    } else {
        setChangesInUnitplan(grade, unitplan, replacementplan1);
        setChangesInUnitplan(grade, unitplan, replacementplan2);
    }
    fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'today', grade + '.json'), JSON.stringify(replacementplan1, null, 2));
    fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'tomorrow', grade + '.json'), JSON.stringify(replacementplan2, null, 2));

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
                weekday: '',
                weektype: ''
            },
            updated: {
                date: '',
                time: ''
            }
        };
        return day;
    });
};

export const setChangesInUnitplan = (grade: string, unitplan: any, replacementplan: any) => {

    if (replacementplan.data !== undefined) {
        // Convert weekday strings to numbers
        replacementplan.data = replacementplan.data.map((change: any) => {
            change.weekday = weekdayToInt(replacementplan.for.weekday);
            return change;
        });

        // Set new replacementplan dates
        unitplan.data[weekdayToInt(replacementplan.for.weekday)].replacementplan = {
            for: {
                date: replacementplan.for.date,
                weekday: replacementplan.for.weekday,
                weektype: replacementplan.for.weektype
            },
            updated: {
                date: replacementplan.updated.date,
                time: replacementplan.updated.time
            }
        };

        // Add new replacementplan changes
        replacementplan.data.forEach((change: any) => {
            // Get normal subjects in the lesson of the change
            if (unitplan.data[change.weekday].lessons[change.unit.toString()] === undefined) {
                if (change.unit === 5) {
                    unitplan.data[change.weekday].lessons[change.unit.toString()] = [{
                        block: '',
                        participant: '',
                        subject: 'Mittagspause',
                        room: '',
                        course: '',
                        changes: [],
                        week: 'AB'
                    }];
                } else {
                    unitplan.data[change.weekday].lessons[change.unit.toString()] = [{
                        block: '',
                        participant: '',
                        subject: 'Freistunde',
                        room: '',
                        course: '',
                        changes: [],
                        week: 'AB'
                    }];
                }
            }
            const subjects = unitplan.data[change.weekday].lessons[change.unit.toString()].filter((subject: any) => {
                return subject.week.toLowerCase().includes(replacementplan.for.weektype.toLowerCase());
            });
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
                        if (subject.block !== '') {
                            Object.keys(unitplan.data[weekdayToInt(replacementplan.for.weekday)].lessons).forEach((unit: string) => {
                                const s = unitplan.data[weekdayToInt(replacementplan.for.weekday)].lessons[unit];
                                if (s[0].block === subject.block) {
                                    s[subjects.indexOf(subject)].course = subject.course;
                                }
                            });
                        }
                    }
                });
            });
            if (!change.sure && change.change.info !== 'Klausurnachschreiber') {
                console.log(grade, change, subjects);
            }
        });
    }
};
