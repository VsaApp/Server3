import express from 'express';
import download from './axf_download';
import { SubstitutionPlan, AiXformation } from '../utils/interfaces';

export const aixformationRouter = express.Router();
let aixformation: AiXformation;


aixformationRouter.get('/', (req, res) => {
    return res.json(aixformation);
});

export const updateAiXformation = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        download()
            .then((data) => {
                aixformation = data || aixformation ||  defaultValue;
                resolve();
            })
            .catch(() => {
                aixformation = aixformation || defaultValue;
                reject();
            });
    });
};

const defaultValue: AiXformation = {
    date: new Date().toISOString(),
    posts: [],
};