import express from 'express';
import download from './axf_download';
import { SubstitutionPlan, AiXformation } from '../utils/interfaces';

export const aixformationRouter = express.Router();
let aixformation: AiXformation;


aixformationRouter.get('/', (req, res) => {
    return res.json(aixformation);
});

export const updateAiXformation = async (): Promise<void> => {
    aixformation = await download();
};