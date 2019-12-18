import { Timetables, Timetable, Day } from '../utils/interfaces';

export const extractData = (data: string[]): Timetables => {
    const date: Date = new Date();
    const timetables: Timetables = {
        date: date.toISOString(),
        grades: {}
    };

    const lines = data
        .filter((line: string) => line.length > 0 && line.startsWith("U"));

    for (let i = 0; i < lines.length; i++) {
        let definingLines: any[] = [lines[i]];
        for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith("U1")) {
                i += j - i - 1;
                break;
            }
            definingLines.push(lines[j]);
        }
        definingLines = definingLines.map((line: string) => line.split(";")).sort((a, b) => parseInt(a[0].split("")[1]) - parseInt(b[0].split("")[1]));
        if (definingLines.length > 1) {
            let subject = definingLines[0][6].replace(/ {2,}/g, ' ');
            let grades: string[] = [definingLines[0][2].toLowerCase()];
            // Skip unused information
            if (subject === 'BER' || subject === 'KOOR') {
                continue;
            }
            if (definingLines.length > 2 && definingLines[2][0] === 'U6') {
                grades = definingLines[2].slice(3, -1).map((grade: string) => grade.toLowerCase());
            }
            const course: string = subject.split(" ").length > 1 ? subject.split(" ")[1] : null;
            subject = subject.split(" ")[0];
            const block: string = definingLines[0][1];
            const numberOfLessons: number = parseInt(definingLines[1][2]);
            for (var l = 0; l < grades.length; l++) {
                const grade = grades[l];

                // Skip all grades
                if (grade == 'ag') {
                    continue;
                }

                if (!timetables.grades[grade]) {
                    const _grade: Timetable = {
                        grade: grade,
                        date: timetables.date,
                        data: {
                            grade: grade,
                            days: []
                        }
                    };
                    for (let i = 0; i < 5; i++) {
                        _grade.data.days.push({
                            day: i,
                            units: []
                        });
                    }
                    timetables.grades[grade] = _grade;
                }
                const dataLine = definingLines[1].slice(3);
                for (let k = 0; k < numberOfLessons; k++) {
                    const dataElement = dataLine.slice(k * 6, (k + 1) * 6);
                    const day: number = parseInt(dataElement[0]) - 1;
                    const unitCount: number = parseInt(dataElement[2]);
                    let startUnit: number = parseInt(dataElement[1]);
                    const room: string = dataElement[3];
                    const teacher: string = dataElement[4];

                    const _grade = timetables.grades[grade];
                    if (_grade) {
                        for (var j = 0; j < unitCount; j++) {
                            let unit = startUnit + j;
                            if (unit <= 5) {
                                unit--;
                            }
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
                                courseID: `${grade}-${course != null ? course : `${block}+${teacher}`}-${subject}`.toLowerCase(),
                                subjectID: subject.replace(/[0-9]/g, ''),
                                block: block,
                                teacherID: teacher.toLowerCase(),
                                roomID: room.toLowerCase(),
                                week: 2
                            });
                        }
                    }
                }
            }
        }
    }

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
                    if (grade != 'ag') {
                        console.log('Error: Lesson is missing: ', grade, day.day, i);
                    }
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