import { Timetables, Timetable, Day } from '../utils/interfaces';

export const extractData = (data: string[][]): Timetables => {
    const date: Date = new Date();
    const timetables: Timetables = {
        date: date.toISOString(),
        grades: {}
    };

    const lines = data
        .map((line: string[]) => line[0])
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
            const grade: string = definingLines[0][2].toLowerCase();
            if (subject === 'BER' || subject === 'KOOR' || grade == 'AG') {
                continue;
            }
            const course: string = subject.split(" ").length > 1 ? subject.split(" ")[1] : null;
            subject = subject.split(" ")[0];
            const block: string = definingLines[0][1];
            const numberOfLessons: number = parseInt(definingLines[1][2]);
            let count = definingLines[0][8];
            definingLines[1].forEach((i: string) => {
                if (i === 'f') count--;
            });
            if (count != 0) {
                console.log(250 + i, grade);
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
            for (let k = 0; k < numberOfLessons; k++) {
                const day: number = parseInt(definingLines[1][k * 6 + 3]) - 1;
                let unit: number = parseInt(definingLines[1][k * 6 + 4]);
                if (unit <= 5) {
                    unit--;
                }
                const room: string = definingLines[1][k * 6 + 6];
                const teacher: string = definingLines[1][k * 6 + 7];
                /*
                if (subject === '' || block === '' || grade === '' || teacher === '') {
                    console.log(grade, day, unit, subject, teacher);
                    console.log(definingLines);
                }
                */
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
                        console.log(grade, day.day, i);
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