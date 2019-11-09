import express from 'express';
import { subjects } from '../utils/subjects';

export const subjectsRouter = express.Router();

subjectsRouter.get('/', (_, res) => {
    return res.json(subjects);
});