import express from 'express';
import { download } from './calendar_download';
import { Calendar } from '../utils/interfaces';

export const calendarRouter = express.Router();
let data: Calendar | undefined;

calendarRouter.get('/', (req, res) => {
    return res.json(data);
});

/**
 * Updates the calendar
 */
export const updateCalendar = async (): Promise<void> => {
    data = await download(data === undefined) || data;
};