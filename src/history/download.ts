import fs from 'fs';
import path from 'path';
import got from 'got';

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
    if (fileName.endsWith('.json')) fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, fileName), JSON.stringify(data, null, 2));
    else fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, fileName), data);
};

const getPaths = async (url: string) => {
    const raw = (await got(url)).body;
    const paths: any = [];
    raw.split('<a href="').filter((fragment: string, index: number) => {
        if (!fragment.startsWith('..') && fragment.includes('</a>')) paths.push(fragment.split('>')[1].split('<')[0].replace('/', ''));
    });
    return paths;
}

const getJson = async (url: string) => {
    const raw = (await got(url)).body;
    return JSON.parse(raw);
}

const loadHistory = async () => {
    console.log('Load all files...');
    const startTime = new Date();
    const allNewestFiles: any = [];
    const directories = await getPaths('https://history.api.vsa.2bad2c0.de');
    for (let h = 0; h < directories.length; h++){
        const years = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}`);
        for (let i = 0; i < years.length; i++){
            const months = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}`);
            for (let j = 0; j < months.length; j++){
                const days = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}/${months[j]}`);
                for (let k = 0; k < days.length; k++){
                    const files = await getPaths(`https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}/${months[j]}/${days[k]}`);
                    for (let l = 0; l < files.length; l++){
                        const fileName = `https://history.api.vsa.2bad2c0.de/${directories[h]}/${years[i]}/${months[j]}/${days[k]}/${files[l]}`;
                        saveNewVersion(directories[h], (await got(fileName)).body, years[i], months[j], days[k], files[l]);
                    }
                }
            }
        }
    }
    console.log(`Finished loading after ${((new Date()).getTime() - startTime.getTime()) / 1000} sec`);
};

loadHistory();
