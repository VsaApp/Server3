import express from 'express';
import cors from 'cors';
import basicAuth from 'express-basic-auth';
import authorizer from './authentication/auth_butler';
import { roomsRouter } from './rooms/rooms_butler';
import { subjectsRouter } from './subjects/subjects_butler';
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
import versionsRouter from './versions/versions_butler';
import { updateWorkgroups, workgroupsRouter } from './workgroups/workgroups_butler';
import { initFirebase, removeOldDevices } from './utils/firebase';
import { initLdap } from './authentication/ldap';

const app = express();
app.use(cors());

// Add an authorizer for each request
app.use(basicAuth({ authorizer: authorizer, challenge: true, authorizeAsync: true }));

// Set the last active attribute for a user request
app.use((req, res, next) => {
    requestHandler(req);
    next();
});

app.get('/', (req, res) => {
    res.send('Hello world!');
});

// Define all paths
app.use('/login', authRouter);
app.use('/updates', updateRouter);
app.use('/history', historyRouter);
app.use('/timetable', timetableRouter);
app.use('/substitutionplan', substitutionPlanRouter);
app.use('/cafetoria', cafetoriaRouter);
app.use('/calendar', calendarRouter);
app.use('/tags', tagsRouter);
app.use('/teachers', teachersRouter);
app.use('/rooms', roomsRouter);
app.use('/subjects', subjectsRouter);
app.use('/bugs', bugsRouter);
app.use('/versions', versionsRouter);
app.use('/workgroups', workgroupsRouter);

// Init firebase for sending notifications
initFirebase();

// Init ldap for users authentications
initLdap();

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
    await updateTeachers();
    await updateTimetable();
    await updateCalendar();
    await updateCafetoriaMenus();
    await updateWorkgroups();
    await removeOldDevices();
    setTimeout(minutely, 60000 * 60 * 24);
};

// Start download process
(async () => {
    await daily();
    await minutely();
})();

export default app;