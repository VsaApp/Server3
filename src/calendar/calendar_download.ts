import got from 'got';
import fs from 'fs';
import path from 'path';
import {getUrl} from '../utils/downloads';
import {extractData, extractExternalData} from './calendar_parser';
import {setLatestCalendar, compareLatestCalendar} from '../history/history';
import { Calendar, Event } from '../utils/interfaces';

const isDev = process.argv.length === 3;
const pdf_table_extractor = require('pdf-table-extractor');

let url: string;

/**
 * Compares the new [url] with the latest url
 * @param url new download url
 */
const isNew = async (url: string): Promise<boolean> => {
    if (await compareLatestCalendar(url)) {
        setLatestCalendar(url);
        return true;
    }
    return false;
};

/**
 * Fetches data from url in file
 * @param file 
 */
const fetchData = (file: string): Promise<void> => {
    return new Promise((async resolve => {
        const stream = fs.createWriteStream(file);
        got.stream(url).pipe(stream);
        stream.on('finish', resolve);
    }));
};

/**
 * Parses the pdf file into pdf object
 * @param file path to pdf file
 */
const parseData = async (file: string): Promise<any> => {
    return new Promise(((resolve, reject) => {
        pdf_table_extractor(file, resolve, reject);
    }));
};

/**
 * Downloads and extracts the calendar
 * @param alwaysUpdate do not check if the calendar is new
 */
export const download = async (alwaysUpdate = false): Promise<Calendar | undefined> => {
    // Get the download url
    url = await getUrl('Übersichtsplanung über die Termine im', 3);

    // Extract data
    if (await isNew(url) || isDev || alwaysUpdate) {
        // Get the path for the pdf file
        const folder = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        const file = path.join(folder, 'calendar.pdf');

        // Fetches and patches data
        await fetchData(file);
        console.log('Fetched calendar');
        const data = await parseData(file);
        console.log('Parsed calendar');

        const calendar: Calendar = await extractData(data);
        const calendarExtern: Event[] = await extractExternalData(calendar.years);
        console.log('Fetched external calendar');
        console.log('Parsed external calendar');
        calendar.data = calendar.data.concat(calendarExtern);
        return calendar
    }
    return undefined;
};

if (module.parent === null) {
    download(true);
}