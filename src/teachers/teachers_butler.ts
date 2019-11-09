import express from 'express';
import download from './teachers_download';
import { Teacher } from '../utils/interfaces';

export const teachersRouter = express.Router();
let data: Teacher[] | undefined;

teachersRouter.get('/', (req, res) => {
    return res.json(data);
});

/**
 * Updates the teacher
 */
export const updateTeachers = async (): Promise<void> => {
    data = await download(data === undefined) || data;
};