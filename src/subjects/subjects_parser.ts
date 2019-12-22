import { Subjects } from '../utils/interfaces';

export const extractData = (data: string[]): Subjects => {
    const subjects: Subjects = {};
    //TODO: Override and add custom subject names
    data.filter((line) => line.startsWith('F1')).forEach((line) => {
        subjects[line.split(';')[2].toLowerCase()] = line.split(';')[3];
    });
    return subjects;
};