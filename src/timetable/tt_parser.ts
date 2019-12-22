import { Timetables, Timetable, Day, Subject } from '../utils/interfaces';

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
                            const subjectID = subject.replace(/[0-9]/g, '').replace('Schw', 'Sp').toLowerCase();
                            const courseID = `${grade}-${course != null ? course : `${block}+${teacher}`}-${subjectID}`.toLowerCase();
                            const teacherID = teacher.toLowerCase();
                            const _unit = _grade.data.days[day].units[unit];
                            const subjectToUpdate = _unit.subjects.filter((subject) => {
                                return subject.courseID === courseID;
                            })[0];
                            if (subjectToUpdate) {
                                if (subjectToUpdate.teacherID !== teacherID) {
                                    subjectToUpdate.teacherID += `+${teacherID}`;
                                }
                            } else {
                                _unit.subjects.push({
                                    unit: unit,
                                    id: `${grade}-2-${day}-${unit}-${_unit.subjects.length}`,
                                    courseID: courseID,
                                    subjectID: subjectID,
                                    block: block,
                                    teacherID: teacherID,
                                    roomID: room.toLowerCase(),
                                    week: 2
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    Object.keys(timetables.grades).forEach((grade: string, index: number) => {
        let blockIndex = 0;
        timetables.grades[grade].data.days.forEach((day: Day) => {
            // Add lunch breaks
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
                // Add missing lessons (This is only to prevent bugs)
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

                // Generate all block ids
                // Set only the block for all parallels of this subject if the subject do not has already a block
                if (!unit.subjects[0].block.includes('-')) {
                    setBlockOfParallels(timetables.grades[grade].data.days, grade, unit.subjects[0].courseID, blockIndex);
                }
                blockIndex++;
            };
        });
    });

    return timetables;
};

/** Set the blocks of the subjects in the given unit and of all the parallel subjects */
const setBlockOfParallels = (ttDays: Day[], grade: string, courseID: string, index: number): void => {
    const blockID: string = `${grade}-${index}`;
    ttDays.forEach((day) => {
        day.units.forEach((unit) => {
            // Only set the blocks if the searched course id is in this unit
            if (unit.subjects.map((s) => s.courseID).includes(courseID)) {
                unit.subjects.forEach((subject) => {
                    // Only if the block is not set already
                    if (!subject.block.includes('-')) {
                        subject.block = blockID;
                        setBlockOfParallels(ttDays, grade, subject.courseID, index);
                        const blockPart = subject.courseID.split('-')[1].split('+');
                        if (/^\d/.test(blockPart[0])) {
                            blockPart[0] = blockID.split('-')[1];
                            const fragments = subject.courseID.split('-');
                            fragments[1] = blockPart.join('+');
                            subject.courseID = fragments.join('-');
                        }
                    } else if (subject.block !== blockID && subject.unit !== 5) {
                        console.error('Failed to create block system!', subject);
                    }
                });
            }
        });
    });
}