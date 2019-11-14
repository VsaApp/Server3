import express from 'express';
import download from './tt_download';
import { sendNotification } from '../utils/notification';
import { updateApp } from '../utils/update_app';
import {getUsers} from '../tags/users';
import { Timetables, User } from '../utils/interfaces';
import getAuth, { isDeveloper } from '../utils/auth';
import { getGrade } from '../authentication/ldap';

export const timetableRouter = express.Router();
var timetables: Timetables;
var timetablePromise: Promise<Timetables | undefined> | undefined;

timetableRouter.get('/', (req, res) => {
    const auth = getAuth(req);
    const grade = getGrade(auth.username, auth.password);
    return res.json(timetables.grades.get(grade));
});

export const updateTimetable = async (): Promise<void> => {
    timetablePromise = download(timetables !== undefined)
    timetables = await timetablePromise || timetables;
};

export const getTimetableVersion = (): string => {
    return timetables.date;
};

export const getTimetable = async (): Promise<Timetables | undefined> => {
    if (timetables !== undefined) return timetables;
    if (timetablePromise !== undefined) return await timetablePromise;
    return undefined;
}

export const getSubjectIDsFromCourseID = (grade: string, courseID: string): string[] => {
    const timetable = timetables.grades.get(grade);
    if (!timetable) throw `Timetable for ${grade} is undefined!`;
    const subjectIDs = timetable.data.days
        .map((day) => day.units
            .map((unit) => unit.subjects
                .filter((subject) => subject.courseID === courseID)))
        .reduce((i1, i2) => i1.concat(i2))
        .reduce((i1, i2) => i1.concat(i2))
        .map((subject) => subject.id);
    return subjectIDs;
}

export const sendNotifications = async (isDev: Boolean): Promise<void> => {
    try {
        let users = getUsers().filter((user: User) => (!isDev || isDeveloper(user.username)) && user.grade !== undefined);
        console.log('Sending notifications to ' + users.length + ' users');
        await sendNotification({
            users: users,
            group: 'timetableChanged',
            text: 'Es gibt einen neuen Stundenplan!',
            title: 'Stundenplan',
            data: {
                type: 'timetable'
            }
        });

        await updateApp('All', {
            'type': 'timetable',
            'action': 'update'
        }, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
};