import got from 'got';
import fs from 'fs';
import path from 'path';
import {getCurrentJson} from './src/history/utils';
import { downloadHistory } from './src/history/download';

const isCli = module.parent === null;
let _downloadHistory = false;

const startDate = new Date(1, 1, 1);
const endDate = new Date(3000, 1, 1);

process.argv.forEach((arg: string, index: number) => {
    if (arg === '--download') _downloadHistory = true;
    else if (arg.startsWith('--start:')) {
        const date = arg.split(':')[1];
        startDate.setFullYear(parseInt(date.split('.')[2]));
        startDate.setUTCMonth(parseInt(date.split('.')[1]) - 2);
        startDate.setDate(parseInt(date.split('.')[0]));
    }
    else if (arg.startsWith('--end:')) {
        const date = arg.split(':')[1];
        endDate.setFullYear(parseInt(date.split('.')[2]));
        endDate.setUTCMonth(parseInt(date.split('.')[1]) - 2);
        endDate.setDate(parseInt(date.split('.')[0]));
    }
});

export const getPaths = async (url: string) => {
    const raw = (await got(url)).body;
    const paths: any = [];
    raw.split('<a href="').filter((fragment: string, index: number) => {
        if (!fragment.startsWith('..') && fragment.includes('</a>')) paths.push(fragment.split('>')[1].split('<')[0].replace('/', ''));
    });
    return paths;
}

export const getJson = async (url: string) => {
    const raw = (await got(url)).body;
    return JSON.parse(raw);
}

export const getJsonFiles = async (startDate: Date, endDate: Date, onlyNewest: boolean) => {

    console.log('Load all files...');
    const startTime = new Date();
    const allFiles: any = [];
    const years = fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan'));
    let daysCount = 0;
    for (let i = 0; i < years.length; i++){
        const months = fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', years[i]));
        for (let j = 0; j < months.length; j++){
            const days = fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', years[i], months[j]));
            for (let k = 0; k < days.length; k++){
                if (startDate.getTime() > new Date(parseInt(years[i]), parseInt(months[j]) - 1, parseInt(days[k])).getTime() || 
                    endDate.getTime() < new Date(parseInt(years[i]), parseInt(months[j]) - 1, parseInt(days[k])).getTime()) continue;
                daysCount++;
                const files = fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', years[i], months[j], days[k])).filter((file: string) => file.endsWith('.html'));
                if (onlyNewest) {
                    const fileName = path.resolve(process.cwd(), 'history', 'replacementplan', years[i], months[j], days[k], files.reverse()[0]);
                    allFiles.push(await getCurrentJson(fileName));
                }
                else {
                    for (let l = 0; l < files.length; l++){
                        const fileName = path.resolve(process.cwd(), 'history', 'replacementplan', years[i], months[j], days[k], files[l]);
                        allFiles.push(await getCurrentJson(fileName));
                    }
                }
            }
        }
    }
    console.log(`Finished loading after ${((new Date()).getTime() - startTime.getTime()) / 1000} sec`);
    console.log(`Current stats for ${allFiles.length} files (${daysCount} days)`);

    return allFiles;
};

export const changesPerGrade = (allNewestFiles: any) => {
    console.log('\n\n--Changes per grade--');
    const grades: any = {};
    allNewestFiles.forEach((replacementplan: any) => {
        replacementplan.forEach((grade: any) => {
            grade.data.forEach((change: any) => {
                if (grades[grade.participant] === undefined) grades[grade.participant] = 0;
                grades[grade.participant]++;
            });
        });
    });
    let maxCount = 0;
    Object.keys(grades).forEach((grade: string) => maxCount = grades[grade] > maxCount ? grades[grade] : maxCount);
    Object.keys(grades).forEach((grade: string) => {
        console.log(`${grade}: ${("000000" + grades[grade]).slice(-(maxCount.toString().length))} (${(grades[grade] / allNewestFiles.length).toFixed(1)} per day)`);
    });
}

const logStats = async () => {
    if (_downloadHistory) await downloadHistory();
    const files = await getJsonFiles(startDate, endDate, true);
    changesPerGrade(files);
}

if (isCli) {
    logStats();
}
