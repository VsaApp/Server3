import { Subjects } from '../utils/interfaces';

export const extractData = (data: string[]): Subjects => {
    const subjects: Subjects = {};
    data.filter((line) => line.startsWith('F1')).forEach((line) => {
        subjects[line[2].toLowerCase()] = line[3];
    });
    return subjects;
};