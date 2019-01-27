import fs from 'fs';
import path from 'path';
import {weekdayToInt} from './utils';

export const getInjectedUnitplan = (grade: string) => {
    const unitplan = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'unitplan', grade + '.json')).toString());
    let replacementplan1: any = {data: []};
    try {
        replacementplan1 = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'today', grade + '.json')).toString());
    } catch (e) {

    }
    let replacementplan2: any = {data: []};
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
        return day;
    });
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

export const updateUnitPlan = (data: any) => {
    const file = path.resolve(process.cwd(), 'out', 'unitplan', data.participant + '.json');
    let unitplan = JSON.parse(fs.readFileSync(file, 'utf-8'));
    data.data.forEach((change: any) => {
        const day = unitplan.data.filter((day: any) => {
            return data.for.weekday === day.weekday;
        })[0];
        const lesson = day.lessons[change.unit.toString()];
        if (lesson.length === 1) {
            lesson.course = change.course;
        }
        const matchingSubjects = lesson.filter((subject: any) => {
            return (subject.subject === change.subject || subject.room === change.room || subject.teacher === change.room) && change.change.info !== 'Klausur';
        });
        if (matchingSubjects.length === 1) {
            lesson[lesson.indexOf(matchingSubjects[0])].course = change.course;
        }
        const multiMatchingSubjects: any = [];
        unitplan.data.forEach((day: any) => {
            Object.keys(day.lessons).forEach((unit: string) => {
                const lesson = day.lessons[unit];
                if (lesson.length > 0) {
                    lesson.forEach((subject: any) => {
                        if (subject.subject === change.subject && subject.teacher === subject.teacher) {
                            multiMatchingSubjects.push(subject);
                        }
                    });
                }
            });
        });
        if (multiMatchingSubjects.length <= 3) {
            for (let m = 0; m < multiMatchingSubjects.length; m++) {
                multiMatchingSubjects[m].course = change.course;
            }
        }
    });
    fs.writeFileSync(file, JSON.stringify(unitplan, null, 2));
};
