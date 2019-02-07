import fs from 'fs';
import path from 'path';
import {getCurrentJson} from './history';

const testParser = () => {
    fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan')).forEach((year: string) => {
        fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year)).forEach((month: string) => {
            fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year, month)).forEach((day: string) => {
                fs.readdirSync(path.resolve(process.cwd(), 'history', 'replacementplan', year, month, day)).filter((file: string) => file.endsWith('.html')).forEach(async (file: string) => {
                    const filePath = path.resolve(process.cwd(), 'history', 'replacementplan', year, month, day, file);
                    const json = await getCurrentJson(filePath);
                    console.log(`Parse file '${filePath}'`);

                    const pathSegments = ['historyTest', 'replacementplan', year, month, day];
                    for (let i = 0; i < pathSegments.length; i++) {
                        let relDir = '';
                        for (let j = 0; j <= i; j++) relDir += pathSegments[j] + '/';
                        const dir = path.resolve(process.cwd(), relDir);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                    }

                    // Create files...
                    fs.writeFileSync(path.resolve(process.cwd(), 'historyTest', 'replacementplan', year, month, day, file.replace('.html', '.json')), JSON.stringify(json, null, 2));

                    //console.log(`Current json: ${json}`);
                });
            });
        });
    });
}

testParser();