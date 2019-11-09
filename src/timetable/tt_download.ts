import fs from 'fs';
import config from '../utils/config';
import got from 'got';
import {parse} from 'node-html-parser';
import {setLatestTimetable, getLatestTimetable} from '../history/history';
import {initFirebase} from '../utils/firebase';
import {concatWeeks, extractData} from './tt_parser';
import {sendNotifications} from './tt_butler';
import { Timetables } from '../utils/interfaces';

const isDev = process.argv.length === 3;
const timetablePath = process.argv.length === 4 ? process.argv[3] : undefined;

const isNew = (dataA: string, dataB: string): boolean => {
    const oldFile = getLatestTimetable();
    return dataA !== oldFile[0] || dataB !== oldFile[1];
};

/**
 * Fetches the html string for the given week
 * @param weekA fetches either week a or week b
 */
const fetchData = async (weekA = true): Promise<string> => {
    const week = weekA ? 'A.html' : 'B.html';
    let path = timetablePath || `https://www.viktoriaschule-aachen.de/sundvplan/sps/${weekA ? 'left' : 'right'}.html`;
    if (timetablePath !== undefined) path = path.replace('.html', week);
    if (path.startsWith('http')) return (await got(path, {auth: config.username + ':' + config.password})).body;
    else return fs.readFileSync(path, 'utf-8').toString();
};

/**
 * Downloads and parses the timetable
 * @param checkIfUpdated if false, always update the timetable, but without notifications
 * @returns the [Timetables]
 */
const download = async (checkIfUpdated = true): Promise<Timetables | undefined> => {
    // Get html strings for week A and B
    const rawA = await fetchData(true);
    const rawB = await fetchData(false);

    // Check if the timetable is new
    console.log('Fetched timetable');
    const _isNew = isNew(rawA, rawB);
    if (_isNew || isDev || !checkIfUpdated) {

        // Save the new version
        setLatestTimetable(rawA, rawB);

        // Parse the html strings to html objects
        const dataA = parse(rawA);
        const dataB = parse(rawB);
        console.log('Parsed timetable');

        // Parse the timetables and combine them to one
        const timetableA = extractData(0, dataA);
        const timetableB = extractData(1, dataB);
        const timetable = concatWeeks(timetableA, timetableB);
        console.log('Extracted timetable');
        
        // Send notifications
        if (_isNew || isDev) sendNotifications(isDev);
        return timetable;
    }
    return undefined
};

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    download(false);
}

export default download;