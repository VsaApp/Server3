import fs from 'fs';
import path from 'path';

const saveNewVersion = (directoriy: string, raw: string, data: any, year: string, month: string, day: string, time: string) => {
    
    // Create all directories...
    const pathSegments = ['history', directoriy, year, month, day];
    for (let i = 0; i < pathSegments.length; i++){
        let relDir = '';
        for(let j = 0; j <= i; j++) relDir += pathSegments[j] + '/';
        const dir = path.resolve(process.cwd(), relDir);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    }

    // Create files...
    fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, time + '.json'), JSON.stringify(data, null, 2));
    fs.writeFileSync(path.resolve(process.cwd(), 'history', directoriy, year, month, day, time + '.html'), raw);
};

const getFileName = () => {
    return Math.round((new Date()).getTime() / 1000).toString();
}

export const saveNewReplacementplan = (raw: string, parsed: any) => {
    const year = parsed[0].for.date.split('.')[2];
    const month = parsed[0].for.date.split('.')[1];
    const day = parsed[0].for.date.split('.')[0];

    saveNewVersion('replacementplan', raw, parsed, year, month, day, getFileName());
};

export const saveNewUnitplan = (raw: string, parsed: any) => {
    const year = parsed[0].date.split('.')[2].length < 4 ? '20' + parsed[0].date.split('.')[2] : parsed[0].date.split('.')[2];
    const month = parsed[0].date.split('.')[1];
    const day = parsed[0].date.split('.')[0];

    saveNewVersion('unitplan', raw, parsed, year, month, day, getFileName());
};