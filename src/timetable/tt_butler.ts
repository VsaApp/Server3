import express from 'express';
import download from './tt_download';
import { sendNotification } from '../utils/notification';
import { updateApp } from '../utils/update_app';
import { Timetables, Device } from '../utils/interfaces';
import getAuth from '../utils/auth';
import { getGrade } from '../authentication/ldap';
import { getUsers, getDevices, getAllDevices } from '../tags/tags_db';
import localizations from '../utils/localizations';

export const timetableRouter = express.Router();
var timetables: Timetables;
var timetablePromise: Promise<Timetables | undefined> | undefined;

timetableRouter.get('/', (req, res) => {
    const auth = getAuth(req);
    const grade = getGrade(auth.username, auth.password);
    return res.json(timetables.grades[grade]);
});

/**
 * Updates the timetable
 */
export const updateTimetable = async (): Promise<void> => {
    timetablePromise = download(timetables !== undefined)
    timetables = await timetablePromise || timetables;
};

/**
 * Returns the version of the current timetable
 */
export const getTimetableVersion = (): string => {
    return timetables.date;
};

/**
 * Returns the current timetable
 */
export const getTimetable = async (): Promise<Timetables | undefined> => {
    if (timetables !== undefined) return timetables;
    if (timetablePromise !== undefined) return await timetablePromise;
    return undefined;
}

/**
 * Returns all subjects ids of one course id
 * @param grade for timetable
 * @param courseID searched [courseID]
 */
export const getSubjectIDsFromCourseID = (grade: string, courseID: string): string[] => {
    const timetable = timetables.grades[grade];
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

/**
 * Sends the new timetable notifications to all users
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (isDev: boolean): Promise<void> => {
    try {
        let devices: Device[] = [];
        if (isDev) {
            let users = await getUsers(isDev);
            for (let user of users) {
                devices = devices.concat(await getDevices(user.username));
            }
        } else {
            devices = await getAllDevices();
        }
        console.log('Sending notifications to ' + devices.length + ' devices');

        await sendNotification({
            devices: devices,
            group: 'timetableChanged',
            text: localizations.newTimetable,
            title: localizations.timetable,
            data: {
                type: 'timetable'
            }
        });

        // Inform the app about a new timetable
        await updateApp('All', {
            'type': 'timetable',
            'action': 'update'
        }, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
};