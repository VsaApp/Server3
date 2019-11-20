import config from '../utils/config';
import {getRoomID} from '../utils/rooms';
import {getSubject} from '../utils/subjects';
import { Timetables, Timetable, Day, Unit, Subject } from '../utils/interfaces';

export const extractData = (data: string[][]): Timetables => {
    const date: Date = new Date();
    const timetables: Timetables = {
        date: date.toISOString(),
        grades: {}
    };

    data.forEach((line: string[]) => {
        if (line.length === 0 || line[0].length === 0) return;
        try {
            let unit = parseInt(line[6]) - 1;
            if (unit >= 5) unit++;
            const grade = line[1].toLowerCase();
            if (grade.length === 0 || grade === 'ag') return;
            const teacherID = line[2].toLowerCase();
            const block = line[0];
            line[3] = line[3].replace(/  +/g, ' ');
            const subjectID = line[3].split(' ')[0].replace(/\d/g, '').toLowerCase();
            const courseID = `${grade}-${line[3].split(' ').length > 1 ? line[3].split(' ')[1].toLowerCase() : `${block}+${teacherID}`}-${subjectID}`;
            const roomID = getRoomID(line[4]);
            const day = parseInt(line[5]) - 1;

            if (!timetables.grades[grade]) {
                const _grade: Timetable = {
                    grade: grade,
                    date: timetables.date,
                    data: {
                        grade: grade,
                        days: []
                    }
                };
                for (var i = 0; i < 5; i++) {
                    _grade.data.days.push({
                        day: i,
                        units: []
                    });
                }
                timetables.grades[grade] = _grade;
            }

            const _grade = timetables.grades[grade];
            if (_grade) {
                if (!_grade.data.days[day].units[unit]) {
                    _grade.data.days[day].units[unit] = {
                        unit: unit,
                        subjects: [{
                            id: `${grade}-2-${day}-${unit}-0`,
                            unit: unit,
                            block: block,
                            courseID: `${grade}-${block}-`,
                            teacherID: '',
                            subjectID: 'Freistunde',
                            roomID: '',
                            week: 2
                        }]
                    }
                }
                const _unit = _grade.data.days[day].units[unit];
                _unit.subjects.push({
                    unit: unit,
                    id: `${grade}-2-${day}-${unit}-${_unit.subjects.length}`,
                    courseID: courseID,
                    subjectID: subjectID,
                    block: block,
                    teacherID: teacherID,
                    roomID: roomID,
                    week: 2
                });
            }
        } catch (_) {
            console.log(line);
        }
    });

    // Add lunch breaks
    Object.keys(timetables.grades).forEach((grade: string) => {
        timetables.grades[grade].data.days.forEach((day: Day) => {
            if (day.units.length > 5) {
                day.units[5] = {
                    unit: 5,
                    subjects: [
                        {
                            unit: 5,
                            id: `${grade}-2-${day.day}-5-0`,
                            teacherID: '',
                            subjectID: 'Mittagspause',
                            roomID: '',
                            courseID: `${grade}--`,
                            block: '',
                            week: 2
                        }
                    ]
                };
            }
            for (var i = 0; i < day.units.length; i++) {
                const unit = day.units[i];
                if (!unit) {
                    console.log(grade, day.day, i);
                    day.units[i] = {
                        unit: i,
                        subjects: [{
                            id: `${grade}-2-${day.day}-${i}-0`,
                            unit: i,
                            block: '',
                            courseID: `${grade}--`,
                            teacherID: '',
                            subjectID: 'Freistunde',
                            roomID: '',
                            week: 2
                        }]
                    };
                }
            };
        });
    });

    return timetables;
};