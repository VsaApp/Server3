import got from 'got';
import {getCurrentJson} from './src/history/history';
import { downloadHistory } from './src/history/download';

const _downloadHistory = process.argv.length === 3 ? (process.argv[2] === '--download') : false;

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

export const loadHistory = async () => {

    if (_downloadHistory) await downloadHistory();

    console.log('Load all files...');
    const startTime = new Date();
    const allNewestFiles: any = [];
    const years = await getPaths('https://history.api.vsa.2bad2c0.de/replacementplan');
    for (let i = 0; i < years.length; i++){
        const months = await getPaths(`https://history.api.vsa.2bad2c0.de/replacementplan/${years[i]}`);
        for (let j = 0; j < months.length; j++){
            const days = await getPaths(`https://history.api.vsa.2bad2c0.de/replacementplan/${years[i]}/${months[j]}`);
            for (let k = 0; k < days.length; k++){
                const files = await getPaths(`https://history.api.vsa.2bad2c0.de/replacementplan/${years[i]}/${months[j]}/${days[k]}`);
                const fileName = `https://history.api.vsa.2bad2c0.de/replacementplan/${years[i]}/${months[j]}/${days[k]}/` + files.reverse().filter((name: string) => name.endsWith('.html'))[0];
                allNewestFiles.push(await getCurrentJson(fileName));
            }
        }
    }
    console.log(`Finished loading after ${((new Date()).getTime() - startTime.getTime()) / 1000} sec`);
    console.log(`Currently history for ${allNewestFiles.length} days online`);

    const grades: any = {};
    allNewestFiles.forEach((replacementplan: any) => {
        replacementplan.forEach((grade: any) => {
            grade.data.forEach((change: any) => {
                if (grades[grade.participant] === undefined) grades[grade.participant] = 0;
                grades[grade.participant]++;
            });
        });
    });
    
    console.log(grades);
};

loadHistory();
