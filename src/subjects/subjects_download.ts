import fs from 'fs';
import path from 'path';
import { extractData } from './subjects_parser';
import { Subjects } from '../utils/interfaces';

/**
 * Fetches the schuldatentransfer file
 */
const fetchData = async (): Promise<string> => {
    return fs.readFileSync(path.resolve(process.cwd(), 'unstf.txt'), 'utf-8').toString();
};

const parse = (raw: string): string[] => {
    return raw.replace(/\"/g, '').split('\n');
}

/**
 * Fetches and parses the subjects
 * @returns the [Subject]
 */
const download = async (): Promise<Subjects | undefined> => {
    const raw = await fetchData();

    // Check if the subjects are new
    console.log('Fetched subjects');

    // Clean the raw string
    const data = parse(raw);
    console.log('Parsed timetable');

    // Parse the subjects
    const subjects = extractData(data);
    console.log('Extracted timetable');

    return subjects;
};

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    download();
}

export default download;