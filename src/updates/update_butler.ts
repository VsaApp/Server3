import fs from 'fs';
import express from 'express';
import { UpdateData } from '../utils/interfaces';
import { getSubstitutionPlanVersion } from '../substitution_plan/sp_butler';
import { getTimetableVersion } from '../timetable/tt_butler';
import { getGrade } from '../authentication/ldap';
import getAuth from '../utils/auth';
import { subjectsDate } from '../utils/subjects';
import { roomsDate } from '../utils/rooms';
import { getUpdates } from './update_db';
import crypto from 'crypto';

const updatesRouter = express.Router();

// Sends the update data
updatesRouter.get('/', async (req, res) => {
    const allUpdates = await getUpdates();
    const auth = getAuth(req);
    const updates: UpdateData = {
        timetable: getTimetableVersion(),
        cafetoria: crypto.createHash('sha1').update((allUpdates.get('cafetoria') || '').toString()).digest('hex'),
        calendar: crypto.createHash('sha1').update((allUpdates.get('calendar') || '').toString()).digest('hex'),
        workgroups: crypto.createHash('sha1').update((allUpdates.get('workgroups') || '').toString()).digest('hex'),
        teachers: crypto.createHash('sha1').update((allUpdates.get('teachers') || '').toString()).digest('hex'),
        substitutionPlan: getSubstitutionPlanVersion(),
        subjects: subjectsDate,
        rooms: roomsDate,
        minAppLevel: 27,
        grade: getGrade(auth.username, auth.password)
    };
    return res.json(updates);
});

export default updatesRouter;