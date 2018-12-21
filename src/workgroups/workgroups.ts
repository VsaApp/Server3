import got from 'got';
import path from 'path';
import fs from 'fs';

const pdf_table_extractor = require('pdf-table-extractor');

(<any>Array.prototype).insert = function (index: number) {
    this.splice.apply(this, [index, 0].concat(
        Array.prototype.slice.call(arguments, 1)));
    return this;
};

const fetchData = (file: string) => {
    return new Promise((async resolve => {
        const stream = fs.createWriteStream(file);
        got.stream('https://viktoriaschule-aachen.de/dokumente/upload/80459_AG_Zeiten_Schuljahr_2018_2019_Stand_20180927.pdf').pipe(stream);
        stream.on('finish', resolve);
    }));
};

const parseData = async (file: string) => {
    return new Promise(((resolve, reject) => {
        pdf_table_extractor(file, resolve, reject);
    }));
};

const extractData = async (data: any) => {
    let list: any = [];
    let tables = data.pageTables[0].tables;
    tables.pop();
    tables.pop();
    tables = tables.map((d: any) => d.map((e: any) => e.split('\n').map((f: any) => f.trim())));
    tables.forEach((row: any, i: number) => {
        row.forEach((column: any, j: number) => {
            if (!column[0].toLowerCase().startsWith('bepa') && !column[0].toLowerCase().startsWith('ags')) {
                if (i === 0) {
                    column.forEach((inRow: string) => {
                        list.push({ weekday: inRow, data: [] });
                    });
                } else {
                    if (column[0] !== '' && !column[0].toLowerCase().startsWith('lehrer') && !column[0].toLowerCase().includes('beeck')) {
                        if (column.length === 3) {
                            if (column[0].toLowerCase() === 'zirkus') {
                                column.insert(1, '');
                            } else {
                                column.push('');
                            }
                        }
                        let name = column[0]
                            .trim();
                        let participants = column[1]
                            .replace('Jgst.', '')
                            .trim();
                        if (participants.includes('-')) {
                            participants = participants.replace('-', ' - ');
                        }
                        if (participants.includes('/')) {
                            participants = participants.replace('/', ' - ');
                        }
                        let time = column[2]
                            .toLowerCase()
                            .replace('uhr', '')
                            .replace('–', '-')
                            .trim();
                        if (time.includes('-')) {
                            let timeS = time.split('-')[0];
                            let timeE = time.split('-')[1];
                            if (timeS.includes('.')) {
                                timeS = timeS.replace('.', ':');
                            } else {
                                timeS += ':00';
                            }
                            if (timeE.includes('.')) {
                                timeE = timeE.replace('.', ':');
                            } else {
                                timeE += ':00';
                            }
                            time = timeS + ' - ' + timeE;
                        }
                        let place = column[3]
                            .toLowerCase()
                            .replace('gr. halle', 'GRH')
                            .replace('gr halle', 'GRH')
                            .replace('gr ha', 'GRH')
                            .replace('r ', '')
                            .replace('aula', 'AUL')
                            .replace('kl. halle', 'KLH')
                            .replace('kl halle', 'KLH')
                            .replace('kl ha', 'KLH')
                            .trim();
                        list[j].data.push({
                            name,
                            participants,
                            time,
                            place
                        });
                    }
                }
            }
        });
    });
    return list;
};

(async () => {
    const file = path.resolve(process.cwd(), 'out', 'workgroups', 'list.pdf');
    fetchData(file).then(() => {
        console.log('Fetched work groups');
        parseData(file).then(async data => {
            console.log('Parsed work groups');
            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'workgroups', 'workgroups.json'), JSON.stringify(await extractData(data), null, 2));
            console.log('Saved work groups');
        }).catch(e => {
            console.log(e);
        });
    });
})();