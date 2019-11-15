import fs from 'fs';
import path from 'path';
import {parse} from 'node-html-parser';
import { parseDates as sp_parseDates} from '../substitution_plan/sp_parser';

/**
 * Saves a file in the history
 * @param data the [data] that should be stored
 * @param folder the [folder] in the history
 * @param fileName the [fileName] without ending
 * @param date the [date] of the [data]
 */
const save = (data: string, folder: string, fileName: string, date: Date): void => {
    const dir = path.resolve(process.cwd(), 'history', folder, date.getFullYear().toString(), (date.getMonth() + 1).toString(), date.getDate().toString());
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    } 
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, data);
};


/**
 * Saves the html string in the history folder
 * @param day number of the day
 * @param data raw html string
 */
export const setLatestSubstitutionPlan = (day: number, data: string): void => {
    const dir = path.resolve(process.cwd(), 'history', 'substitution_plan');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    } 
    const filePath = path.join(dir, `${day}.html`);
    fs.writeFileSync(filePath, data);

    // Save substitution plan
    const dates = sp_parseDates(parse(data));
    const update = new Date(dates.update);
    const date = new Date(dates.date);
    save(data, 'substitution_plan', update.getTime().toString() + '.html', date);
};

/**
 * Returns the raw html string of the given day
 * @param day number of the day
 * @returns the html string
 */
export const getLatestSubstitutionPlan = (day: number): string => {
    const filePath = path.resolve(process.cwd(), 'history', 'substitution_plan', `${day}.html`);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString();
    }
    return '';
};


const getLatest = (folder: string): string | undefined => {
    const filePath = path.resolve(process.cwd(), 'history', folder, `current.txt`);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString().trim();
    }
    return undefined;
}

const setLatest = (folder: string, content: String): void => {
    const dir = path.resolve(process.cwd(), 'history', folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    } 
    const filePath = path.join(dir, `current.txt`);
    fs.writeFileSync(filePath, content);
};

export const setLatestCafetoria = (date: Date): void => setLatest('cafetoria', date.toISOString());
export const getLatestCafetoria = (): Date => new Date(getLatest('cafetoria') || '01 01 2000');

export const setLatestCalendar = (url: string): void => setLatest('calendar', url);
export const getLatestCalendar = (): string => getLatest('calendar') || '';

export const setLatestTeachers = (url: string): void => setLatest('teachers', url);
export const getLatestTeachers = (): string => getLatest('teachers') || '';

export const setLatestWorkgroups = (url: string): void => setLatest('workgroups', url);
export const getLatestWorkgroups = (): string => getLatest('workgroups') || '';

export const setLatestTimetable = (data: string): void => setLatest('timetable', data);
export const getLatestTimetable = (): string => getLatest('timetable') || '';