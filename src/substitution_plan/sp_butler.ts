import express from 'express';
import download from './sp_download';
import { SubstitutionPlan } from '../utils/interfaces';

export const substitutionPlanRouter = express.Router();
const days: (SubstitutionPlan | undefined)[] = [undefined, undefined];


substitutionPlanRouter.get('/', (req, res) => {
    return res.json(days);
});

export const updateSubstitutionPlan = async (): Promise<void> => {
    const newDays = await download(days[0] !== undefined && days[1] !== undefined);
    if (newDays[0] !== undefined) days[0] = newDays[0];
    if (newDays[1] !== undefined) days[1] = newDays[1];
};

export const getSubstitutionPlanVersion = (): string => {
    if (days[0] !== undefined){
        return days[0].updated;
    }
    return '';
};

export const getSubstitutionPlan = (): (SubstitutionPlan | undefined)[] => {
    return days;
}
