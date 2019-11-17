import fs from 'fs';
import path from 'path';
import config from '../utils/config';
import got from 'got';
import {setLatestTimetable, getLatestTimetable} from '../history/history';
import {initFirebase} from '../utils/firebase';
import {extractData} from './tt_parser';
import {sendNotifications} from './tt_butler';
import { Timetables } from '../utils/interfaces';
import { clearSelections } from '../tags/users';

const isDev = process.argv.length === 3;
const timetablePath = process.argv.length === 4 ? process.argv[3] : undefined;

const isNew = (data: string): boolean => {
    const oldFile = getLatestTimetable();
    return data.replace(/\"|\\n|\\r/g, '').trim() !== oldFile.replace(/\"|\\n|\\r/g, '').trim();
};

/**
 * Fetches the html string for the given week
 * @param weekA fetches either week a or week b
 */
const fetchData = async (): Promise<string> => {
    return fs.readFileSync(path.resolve(process.cwd(), 'timetable.txt'), 'utf-8').toString();
};

const parse = (raw: string): string[][] => {
    return raw.replace(/\"/g, '').split('\n').map((line) => line.split(','));
} 

/**
 * Downloads and parses the timetable
 * @param checkIfUpdated if false, always update the timetable, but without notifications
 * @returns the [Timetables]
 */
const download = async (checkIfUpdated = true): Promise<Timetables | undefined> => {
    // Get html strings for week A and B
    const raw = await fetchData();

    // Check if the timetable is new
    console.log('Fetched timetable');
    const _isNew = isNew(raw);
    if (_isNew || isDev || !checkIfUpdated) {

        // Save the new version
        setLatestTimetable(raw);

        // Parse the html strings to html objects
        const data = parse(raw);
        console.log('Parsed timetable');

        // Parse the timetables and combine them to one
        const timetable = extractData(data);
        console.log('Extracted timetable');
        
        // Send notifications
        if (_isNew) clearSelections();
        if (_isNew || isDev) await sendNotifications(isDev);
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