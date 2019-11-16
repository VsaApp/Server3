import express from 'express';
import download from './tt_download';
import { sendNotification } from '../utils/notification';
import { updateApp } from '../utils/update_app';
import {getUsers} from '../tags/users';
import { Timetables, User, Device } from '../utils/interfaces';
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

/**
 * Sends the new timetable notifications to all users
 * @param isDev send only to developers (for debugging)
 */
export const sendNotifications = async (isDev: Boolean): Promise<void> => {
    try {
        let users = getUsers().filter((user: User) => (!isDev || isDeveloper(user.username)) && user.grade !== undefined);
        console.log('Sending notifications to ' + users.length + ' users');

        // Sort the devices by language
        const languages = new Map<String, Device[]>();
        users.forEach((user) => user.devices.forEach((device) => {
            if (!languages.get(device.language)) languages.set(device.language, []);
            const language = languages.get(device.language)
            if (language) language.push(device);
        }));

        // Send notifications to each language
        for (var language of Array.from(languages.keys())) {
            await sendNotification({
                devices: languages.get(language),
                group: 'timetableChanged',
                text: language === 'de' ? 'Es gibt einen neuen Stundenplan!' : 'There is a new timetable!',
                title: language === 'de' ? 'Stundenplan' : 'Timetable',
                data: {
                    type: 'timetable'
                }
            });
        }

        // Inform the app about a new timetable
        await updateApp('All', {
            'type': 'timetable',
            'action': 'update'
        }, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
};