import config from '../utils/config';
import got from 'got';
import { CookieJar } from 'tough-cookie';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { getUrl } from '../utils/downloads';
import extractData from './teachers_parser';
import { getLatestTeachers, setLatestTeachers } from '../history/history';
import { Teacher } from '../utils/interfaces';

const isDev = process.argv.length === 3;
const pdf_table_extractor = require('pdf-table-extractor');

let url: string;

/**
 * Checks if the pdf was updated
 * @param url current url
 */
const isNew = (url: string): boolean => {
    let oldUrl = getLatestTeachers();
    if (url !== oldUrl) {
        setLatestTeachers(url);
        return true;
    }
    return false;
};

/**
 * Fetches the pdf file from url
 * @param file path fo pdf file
 */
const fetchData = (file: string): Promise<void> => {
    return new Promise((async resolve => {
        const cookieJar = new CookieJar();
        const form = new FormData();
        form.append('username', config.username);
        form.append('password', config.password);
        await got('https://viktoriaschule-aachen.de/index.php', {
            cookieJar, body: form
        });
        const stream = fs.createWriteStream(file);
        url = await getUrl('Kollegiumsliste mit Angabe', 41);
        got.stream(url, {
            auth: config.username + ':' + config.password,
            cookieJar
        }).pipe(stream);
        stream.on('finish', resolve);
    }));
};

/**
 * Parses the pdf file to an pdf object
 * @param file path pdf file
 */
const parseData = async (file: string): Promise<any> => {
    return new Promise(((resolve, reject) => {
        pdf_table_extractor(file, resolve, reject);
    }));
};

/**
 * Downloads the teacher list
 * @param alwaysUpdate do not check if the list was updated
 */
const download = async (alwaysUpdate = false): Promise<Teacher[] | undefined> => {
    // Get the path for the pdf file
    const folder = path.resolve(process.cwd(), 'history', 'teachers');
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    const file = path.join(folder, 'teachers.pdf');

    // Fetch and parse the pdf file
    await fetchData(file);
    console.log('Fetched teachers');
    const data = await parseData(file);
    console.log('Parsed teachers');

    // Extract the pdf file
    if (isNew(url) || isDev || alwaysUpdate) {
        console.log('Extract teachers');
        return extractData(data);
    }
    return undefined;
};

if (module.parent === null) {
    download(true).then((teachers) => console.log((teachers || []).length));
}

export default download;