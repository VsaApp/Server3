import fs from 'fs';
import express from 'express';
import { UpdateData } from '../utils/interfaces';
import { getSubstitutionPlanVersion } from '../substitution_plan/sp_butler';
import { getTimetableVersion } from '../timetable/tt_butler';
import { getGrade } from '../authentication/ldap';
import getAuth from '../utils/auth';
import { subjectsDate } from '../utils/subjects';
import { roomsDate } from '../utils/rooms';

const updatesRouter = express.Router();

// Sends the update data
updatesRouter.get('/', async (req, res) => {
    const auth = getAuth(req);
    const updates: UpdateData = {
        timetable: getTimetableVersion(),
        cafetoria: fs.statSync('history/cafetoria/current.txt').mtime.toISOString(),
        calendar: fs.statSync('history/calendar/current.txt').mtime.toISOString(),
        workgroups: fs.statSync('history/workgroups/current.txt').mtime.toISOString(),
        teachers: fs.statSync('history/teachers/current.txt').mtime.toISOString(),
        substitutionPlan: getSubstitutionPlanVersion(),
        subjects: subjectsDate,
        rooms: roomsDate,
        minAppLevel: 27,
        grade: await getGrade(auth.username, auth.password)
    };
    return res.json(updates);
});

export default updatesRouter;