import { setLatestSubstitutionPlan, getLatestSubstitutionPlan } from '../history/history';
import {parse} from 'node-html-parser';
import {fetchData} from '../utils/network';
import parseSubstitutionPlan from './sp_parser';
import { SubstitutionPlan } from '../utils/interfaces';
import { sendNotifications } from './sp_notifications';
import { initFirebase } from '../utils/firebase';

const isDev = process.argv.length >= 3 && process.argv[2].trim() === '--dev';

/**
 * Downloads the html of the website and saves the parsed json
 * @param day the day of the website (0=left; 1=right)
 * @returns {SubstitutionPlan} the substitutionPlan
 */
const downloadDay = async (day: number, checkIfUpdated?: boolean): Promise<SubstitutionPlan | undefined> => {
    // Download the raw html
    const url = `https://www.viktoriaschule-aachen.de/sundvplan/vps/f${day + 1}/subst_001.htm`;
    const raw = await fetchData(url, true);
    console.log('Fetched substitution plan for day ' + day);

    // Get the old html
    const old = getLatestSubstitutionPlan(day);

    // Check if it is a new html or for development
    if (raw != old || isDev || !checkIfUpdated) {
        // Parse the html to an object
        const data = parse(raw);
        console.log('Parsed substitution plan for day ' + day);

        // Parse html to json
        const substitutionPlan = await parseSubstitutionPlan(data, isDev);
        console.log('Extracted substitution plan for day ' + day);
        
        setLatestSubstitutionPlan(day, raw);

        if (raw != old || isDev) {
            sendNotifications(isDev, day, substitutionPlan);
        }
        
        return substitutionPlan;
    }
    return undefined;
};

/**
 * Downloads both days from the website
 * @returns the downloaded day (undefined when not updated)
 */
const download = async (checkIfUpdated?: boolean): Promise<Array<SubstitutionPlan | undefined>> => {
    const day1 = await downloadDay(0, checkIfUpdated);
    const day2 = await downloadDay(1, checkIfUpdated);
    return [day1, day2];
}

// If this file is started direct from the command line and was not imported
if (module.parent === null) {
    initFirebase();
    download();
}

export default download;
