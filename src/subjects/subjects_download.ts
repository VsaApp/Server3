import fs from 'fs';
import path from 'path';
import { extractData } from './subjects_parser';
import { Subjects } from '../utils/interfaces';
import { compareLatestSubjects, setLatestSubjects } from '../history/history';

const setUpdate = async (data: string): Promise<boolean> => {
    const _isNew = await compareLatestSubjects(data);
    if (_isNew) {
        setLatestSubjects(data);
    }
    return _isNew;
};

/**
 * Fetches the schuldatentransfer file
 */
const fetchData = (): string => {
    return fs.readFileSync(path.resolve(process.cwd(), 'unstf.txt'), 'latin1').toString();
};

const parse = (raw: string): string[] => {
    return raw.replace(/\"/g, '').split('\n').filter((line) => line.startsWith('F'));
}

/**
 * Fetches and parses the subjects
 * @returns the [Subject]
 */
const download = async (): Promise<Subjects | undefined> => {
    const raw = fetchData();
    console.log('Fetched subjects');

    // Clean the raw string
    const data = parse(raw);
    await setUpdate(data.join('\n'));
    console.log('Parsed subjects');

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