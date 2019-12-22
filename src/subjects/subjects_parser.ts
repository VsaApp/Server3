import { Subjects } from '../utils/interfaces';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const extractData = (data: string[]): Subjects => {
    const subjects: Subjects = {};
    data.filter((line) => line.startsWith('F1')).forEach((line) => {
        subjects[line.split(';')[2].toLowerCase()] = line.split(';')[3];
    });
    const fixSubjects = JSON.parse(readFileSync(resolve(process.cwd(), 'subjects.json')).toString());
    Object.keys(fixSubjects).forEach((subject: string) => {
        subjects[subject] = fixSubjects[subject];
    });
    return subjects;
};