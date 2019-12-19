import express from 'express';
import { Subjects } from '../utils/interfaces';
import download from './subjects_download';

export const subjectsRouter = express.Router();

let subjects: Subjects = {};

subjectsRouter.get('/', (_, res) => {
    return res.json(subjects);
});

/** Updates the subjects */
export const updateSubjects = async (): Promise<void> => {
    subjects = await download() || {};
};

/** Returns the current subjects */
export const getSubjects = (): Subjects => {
    return subjects;
}

/** Returns the current subjects */
export const getSubject = (subject: string): String | undefined => {
    return subjects[subject];
}