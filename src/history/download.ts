import fs from 'fs';
import path from 'path';
import got from 'got';

const isCli = module.parent === null;

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

const getPaths = async (url: string) => {
    const raw = (await got(url)).body;
    const paths: any = [];
    raw.split('<a href="').filter((fragment: string, index: number) => {
        if (!fragment.startsWith('..') && fragment.includes('</a>')) paths.push(fragment.split('>')[1].split('<')[0].replace('/', ''));
    });
    return paths;
}

export const downloadHistory = async () => {
    console.log('Download all files...');
    const startTime = new Date();
    const directories = await getPaths('https://history.api.vsa.2bad2c0.de');
    for (let h = 0; h < directories.length; h++){
        console.log(`download ${directories[h]}`);
        const years = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}`);
        for (let i = 0; i < years.length; i++){
            console.log(`   - download year ${years[i]}`);
            const months = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}`);
            for (let j = 0; j < months.length; j++){
                console.log(`      ~ download month ${months[j]}`);
                const days = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}/${months[j]}`);
                for (let k = 0; k < days.length; k++){
                    console.log(`         -- download day ${days[k]}`);
                    const files = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}/${months[j]}/${days[k]}`);
                    for (let l = 0; l < files.length; l++){
                        const fileName = `https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}/${months[j]}/${days[k]}/${files[l]}`;
                        saveNewVersion(directories[h], (await got(fileName)).body, years[i], months[j], days[k], files[l]);
                    }
                }
            }
        }
    }
    console.log(`Finished downloading after ${((new Date()).getTime() - startTime.getTime()) / 1000} sec`);
};

if (isCli) downloadHistory();
