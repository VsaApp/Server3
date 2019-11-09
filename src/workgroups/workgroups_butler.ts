import express from 'express';
import download from './workgroups_download';
import { WorkgroupsDay } from '../utils/interfaces';

export const workgroupsRouter = express.Router();
let data: WorkgroupsDay[] | undefined;

workgroupsRouter.get('/', (req, res) => {
    return res.json(data);
});

/**
 * Updates the calendar
 */
export const updateWorkgroups = async (): Promise<void> => {
    data = await download(data === undefined) || data;
};