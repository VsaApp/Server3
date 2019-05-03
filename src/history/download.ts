import fs from 'fs';
import path from 'path';
import got from 'got';
import config from '../config';

const isCli = module.parent === null;
const auth = `${config.username}:${config.password}`;

const saveNewVersion = (directoriy: string, data: any, year: string, month: string, day: string, fileName: string) => {

    // Create all directories...
    const pathSegments = ['history', directoriy, year, month, day];
    for (let i = 0; i < pathSegments.length; i++) {
        let relDir = '';
        for (let j = 0; j <= i; j++) relDir += pathSegments[j] + '/';
        const dir = path.resolve(process.cwd(), relDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    // Create files...
    fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, fileName), data);
};

const getJson = async (url: string) => {
    return JSON.parse((await got(url)).body)
}

export const downloadHistory = async () => {
    console.log('Download all files...');
    const startTime = new Date();
    const directories = ["replacementplan", "unitplan"];
    for (let h = 0; h < directories.length; h++){
        console.log(`download ${directories[h]}`);
        const years = await getJson(`https://${auth}@history.api.vsa.2bad2c0.de/${directories[h]}`);
        for (let i = 0; i < years.length; i++){
            console.log(`   - download year ${years[i].year}`);
            const months = years[i].months;
            for (let j = 0; j < months.length; j++){
                console.log(`      ~ download month ${months[j].month}`);
                const days = months[j].days;
                for (let k = 0; k < days.length; k++){
                    console.log(`         -- download day ${days[k].day}`);
                    const files = days[k].files;
                    for (let l = 0; l < files.length; l++){
                        const fileName = `https://${auth}@history.vsa.2bad2c0.de/${directories[h]}/${years[i].year}/${months[j].month}/${days[k].day}/${files[l]}`;
                        saveNewVersion(directories[h], (await got(fileName)).body, years[i].year, months[j].month, days[k].day, files[l]);
                    }
                }
            }
        }
    }
    console.log(`Finished downloading after ${((new Date()).getTime() - startTime.getTime()) / 1000} sec`);
};

if (isCli) downloadHistory();
