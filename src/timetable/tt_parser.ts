import config from '../utils/config';
import {getRoomID} from '../utils/rooms';
import {getSubject} from '../utils/subjects';
import { Timetables, Timetable, Day, Unit, Subject } from '../utils/interfaces';

const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'ef', 'q1', 'q2'];
const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

export const parseDate = (data: any): Date => {
    const rawDate = data.querySelector('div').childNodes[0].rawText.split(' den ')[1].trim().split('.');
    return new Date(`${rawDate[1]} ${rawDate[0]} ${rawDate[2]}`);
}

export const extractData = (week: number, data: any): Timetables => {
    var date = parseDate(data).toISOString();
    const timetables: Map<string, Timetable> = new Map<string, Timetable>(); 

    // Extract each grade
    grades.forEach(grade => {
        let days: Day[] = weekdays.map((weekday: string, day: number) => {
            return {
                day: day,
                units: []
            };
        });
        data.querySelectorAll('table')[grades.indexOf(grade)].childNodes.slice(1).forEach((row: any, unit: number) => {
            row.childNodes.slice(1).forEach((field: any, day: number) => {
                const a: any = field.childNodes.map((a: any) => a.childNodes[0].rawText.trim().replace(/ +(?= )/g, '')).filter((a: string, i: number) => a != '' || i == 5);
                if (a.length > 0) {
                    if (days[day].units[unit] === undefined && !(a.length === 1 && a[0].includes('*'))) {
                        days[day].units[unit] = {
                            unit: unit,
                            subjects: []
                        };
                    }
                    if (a.length === 1 && !a[0].includes('*')) {
                        days[day].units[unit].subjects.push({
                            unit: unit,
                            id: `${grade}-${day}-${unit}-${days[day].units[unit].subjects.length}`,
                            teacherID: a[0].split(' ')[0],
                            subjectID: getSubject(a[0].split(' ')[1].toUpperCase().replace(/[0-9]/g, '')),
                            roomID: getRoomID(a[0].split(' ')[2].toUpperCase()),
                            courseID: '',
                            week: week
                        });
                    } else {
                        for (let i = 1; i < a.length; i++) {
                            if (a[i].split(' ').length < 3) {
                                a[i] += ' a';
                            }
                            days[day].units[unit].subjects.push({
                                unit: unit,
                                id: `${grade}-${day}-${unit}-${days[day].units[unit].subjects.length}`,
                                teacherID: a[i].split(' ')[1],
                                subjectID: getSubject(a[i].split(' ')[0].toUpperCase().replace(/[0-9]/g, '')),
                                roomID: getRoomID(a[i].split(' ')[2].toUpperCase()),
                                courseID: a[0].split(' ')[1],
                                week: week
                            });
                        }
                    }
                }
            });
        });
        days = days.map((a: Day, day: number) => {
            if (a.units.length >= 6) {
                a.units[5] = {
                    unit: 5,
                    subjects: [
                        {   
                            unit: 5,
                            id: `${grade}-${day}-5-0`,
                            teacherID: '',
                            subjectID: 'Mittagspause',
                            roomID: '',
                            courseID: '',
                            week: week
                        }
                    ]
                };
            }
            a.units.forEach((unit: Unit) => {
                if (unit.subjects.length > 1 || unit.subjects[0].courseID !== '') {
                    unit.subjects.push({
                        id: `${grade}-${day}-${unit.unit}-${unit.subjects.length}`,
                        unit: unit.unit,
                        courseID: unit.subjects[0].courseID,
                        teacherID: '',
                        subjectID: 'Freistunde',
                        roomID: '',
                        week: week
                    });
                }
            });
            return a;
        });
        days = days.map((a: Day) => {
            if (grade === 'EF' || grade === 'Q1' || grade === 'Q2') {
                a.units.forEach((unit: Unit) => {
                    let b = unit.subjects;
                    const containsMultiple = b.filter((subject: Subject) => {
                        return /^(a|b|c|d)$/gmi.test(subject.roomID);
                    }).length > 0;
                    b = b.map((subject: Subject) => {
                        if (config.isFirstQ) {
                            if (/^(a|b|c|d)$/gmi.test(subject.roomID)) {
                                subject.roomID = '';
                                subject.teacherID = '';
                            }
                        } else {
                            if (containsMultiple) {
                                if (!/^(a|b|c|d)$/gmi.test(subject.roomID)) {
                                    subject.roomID = '';
                                    subject.teacherID = '';
                                }
                            }
                        }
                        return subject;
                    });
                    unit.subjects = b;
                });
            }
            return a;
        });

        timetables.set(grade, {
            grade: grade,
            date: date,
            data: {
                grade: grade,
                days: days
            }
        });
    });

    return {
        date: date,
        grades: timetables
    }
};

export const concatWeeks = (dataA: Timetables, dataB: Timetables): Timetables => {
    const timetable: Timetables = {
        date: dataA.date,
        grades: new Map<string, Timetable>()
    };
    dataA.grades.forEach((gradeA: Timetable) => {
        const gradeB = dataB.grades.get(gradeA.grade);
        if (gradeB === undefined) return;
        const grade: Timetable = {
            grade: gradeA.grade,
            date: gradeA.date,
            data: {
                grade: gradeA.grade,
                days: []
            }
        };

        for (let day = 0; day < gradeA.data.days.length; day++) {
            grade.data.days.push({
                day: day,
                units: []
            });
            for (let unit = 0; unit < 9; unit++) {
                let unitA: Unit | undefined;
                let unitB: Unit | undefined;
                const addFreeLesson = [false, false];
                if (gradeA.data.days[day].units.length > unit) unitA = gradeA.data.days[day].units[unit];
                if (gradeB.data.days[day].units.length > unit) unitB = gradeB.data.days[day].units[unit];

                // The unit do not exists in week a and b
                if (unitA === undefined && unitB === undefined) {
                    continue;
                }
                // The unit only exists in week b
                if (unitA === undefined && unitB !== undefined) {
                    grade.data.days[day].units[unit] = unitB;
                    grade.data.days[day].units[unit].subjects.forEach((subject: Subject) => subject.week = 1);
                    if (unit !== 5) addFreeLesson[0] = true;
                } 
                // The unit only exists in week a
                else if (unitA !== undefined && unitB === undefined) {
                    grade.data.days[day].units[unit] = unitA;
                    grade.data.days[day].units[unit].subjects.forEach((subject: Subject) => subject.week = 0);
                    if (unit !== 5) addFreeLesson[1] = true;
                }
                // If the unit exists in both weeks, compare them 
                else if (unitA !== undefined && unitB !== undefined) {
                    grade.data.days[day].units[unit] = {
                        unit: unit, 
                        subjects: []
                    };
                    const listShort = unitA.subjects.length >= unitB.subjects.length ? unitB : unitA;
                    const listLong = unitA.subjects.length >= unitB.subjects.length ? unitA : unitB;
                    for (let k = 0; k < listLong.subjects.length; k++) {
                        const subject1 = listLong.subjects[k];
                        let found = false;
                        for (let l = 0; l < listShort.subjects.length; l++) {
                            const subject2 = listShort.subjects[l];
                            if (subject1.subjectID === subject2.subjectID && subject1.teacherID === subject2.teacherID && subject1.roomID === subject2.roomID) {
                                subject1.week = 2;
                                grade.data.days[day].units[unit].subjects.push(subject1);
                                listShort.subjects.splice(l, 1);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            subject1.week = unitA.subjects.length >= unitB.subjects.length ? 0 : 1;
                            addFreeLesson[subject1.week == 1 ? 0 : 1] = true;
                            grade.data.days[day].units[unit].subjects.push(subject1);
                        }
                    }
                    if (listShort.subjects.length > 0) {
                        listShort.subjects.forEach((subject: Subject) => {
                            if (unitA !== undefined && unitB !== undefined) {
                                subject.week = unitA.subjects.length >= unitB.subjects.length ? 1 : 0;
                                addFreeLesson[subject.week == 1 ? 0 : 1] = true;
                                grade.data.days[day].units[unit].subjects.push(subject);
                            }
                        });
                    }
                }
                addFreeLesson.forEach((j, index) => {
                    var courseID;
                    if (unitA) unitA.subjects[0].courseID;
                    else if (unitB) unitB.subjects[0].courseID;
                    if (unitA !== undefined || unitB !== undefined) {
                        if (j) grade.data.days[day].units[unit].subjects.push({
                            unit: unit,
                            id: `${grade.grade}-${day}-${unit}-${grade.data.days[day].units[unit].subjects.length}`,
                            teacherID: '',
                            courseID: courseID || '',
                            subjectID: 'Freistunde',
                            roomID: '',
                            week: index == 0 ? 0 : 1
                        });
                    }
                });
            }
        }

        timetable.grades.set(grade.grade, grade);
    });

    return timetable;
};
