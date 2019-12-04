import got from 'got';
import path from 'path';
import fs from 'fs';
import {getUrl} from '../utils/downloads';
import extractData from './workgroups_parser';
import { WorkgroupsDay } from '../utils/interfaces';
import {getLatestWorkgroups, setLatestWorkgroups} from '../history/history';

const isDev = process.argv.length === 3;
const pdf_table_extractor = require('pdf-table-extractor');

let url: string;

/**
 * Check if the url was updated
 * @param url 
 */
const isNew = (url: string): boolean => {
    const oldUrl = getLatestWorkgroups();
    if (url !== oldUrl) {
        setLatestWorkgroups(url);
        return true;
    }
    return false;
};

/**
 * Fetches pdf file from url
 * @param file path to pdf file
 */
const fetchData = (file: string): Promise<void> => {
    return new Promise((async resolve => {
        const stream = fs.createWriteStream(file);
        got.stream(url).pipe(stream);
        stream.on('finish', resolve);
    }));
};

/**
 * Parses pdf file to pdf object
 * @param file path to pdf file
 */
const parseData = async (file: string): Promise<any> => {
    return new Promise(((resolve, reject) => {
        pdf_table_extractor(file, resolve, reject);
    }));
};

/**
 * Downloads the workgroup pdf
 * @param alwaysDownload do not check if pdf was updated
 */
const download = async (alwaysDownload = false): Promise<WorkgroupsDay[] | undefined> => {
    // Get the path for the pdf file
    const folder = path.resolve(process.cwd(), 'history', 'workgroups');
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, {recursive: true});
    }
    const file = path.join(folder, 'workgroups.pdf');

    // Get url
    url = await getUrl('AG-Gesamtübersicht', 152)

    // Fetch and parse pdf
    await fetchData(file);
    console.log('Fetched work groups');
    const data = await parseData(file);
    console.log('Parsed work groups');

    // Extract pdf
    if (isNew(url) || isDev || alwaysDownload) {
        return extractData(data);
    }
    return undefined
};

if (module.parent === null) {
    download(true);
}

export default download;