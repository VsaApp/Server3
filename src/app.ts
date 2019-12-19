import express from 'express';
import cors from 'cors';
import basicAuth from 'express-basic-auth';
import authorizer from './authentication/auth_butler';
import { subjectsRouter, updateSubjects } from './subjects/subjects_butler';
import historyRouter from './history/history_butler';
import updateRouter from './updates/update_butler';
import { substitutionPlanRouter, updateSubstitutionPlan } from './substitution_plan/sp_butler';
import { timetableRouter, updateTimetable } from './timetable/tt_butler';
import { cafetoriaRouter, updateCafetoriaMenus } from './cafetoria/cafetoria_butler';
import { calendarRouter, updateCalendar } from './calendar/calendar_butler';
import { teachersRouter, updateTeachers } from './teachers/teachers_butler';
import tagsRouter, { requestHandler } from './tags/tags_butler';
import { authRouter } from './authentication/auth_butler';
import bugsRouter from './bugs/bugs_router';
import { updateWorkgroups, workgroupsRouter } from './workgroups/workgroups_butler';
import { initFirebase, removeOldDevices } from './utils/firebase';
import { initDatabase } from './utils/database';

const app = express();
app.use(cors());
app.use(basicAuth({ authorizer: authorizer, challenge: true }));
app.use((req, res, next) => {
    next();
    requestHandler(req);
});

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.use('/login', authRouter);
app.use('/updates', updateRouter);
app.use('/history', historyRouter);
app.use('/timetable', timetableRouter);
app.use('/substitutionplan', substitutionPlanRouter);
app.use('/cafetoria', cafetoriaRouter);
app.use('/calendar', calendarRouter);
app.use('/tags', tagsRouter);
app.use('/teachers', teachersRouter);
app.use('/subjects', subjectsRouter);
app.use('/bugs', bugsRouter);
app.use('/workgroups', workgroupsRouter);


/**
 * Downloads every minute the substitutionPlan
 */
const minutely = async (): Promise<void> => {
    await updateSubstitutionPlan();
    setTimeout(minutely, 60000);
};
/**
 * Downloads every 24 hours the substitutionPlan
 */
const daily = async (): Promise<void> => {
    await updateSubjects();
    await updateTeachers();
    await updateTimetable();
    await updateCalendar();
    await updateCafetoriaMenus();
    await updateWorkgroups();
    await removeOldDevices();
    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setHours(18, 0, 0);
    while (tomorrow.getTime() <= now + 60000) {
        tomorrow.setDate(tomorrow.getDate() + 1);
    }
    const difInMillis = tomorrow.getTime() - now;
    setTimeout(daily, difInMillis);
};

// Start download process
(async () => {
    // Init firebase for sending notifications
    await initDatabase();
    initFirebase();
    await daily();
    await minutely();
})();

export default app;