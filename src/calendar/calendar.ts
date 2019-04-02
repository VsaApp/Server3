import got from 'got';
import fs from 'fs';
import path from 'path';

const pdf_table_extractor = require('pdf-table-extractor');

const url = 'https://viktoriaschule-aachen.de/dokumente/upload/9e15f_Terminplanung2018_19_SchuKo_Stand_20180906.pdf';

const isNew = (data: any) => {
    let file = path.resolve(process.cwd(), 'out', 'calendar', 'date.txt');
    let old = '';
    if (fs.existsSync(file)) {
        old = fs.readFileSync(file, 'utf-8').toString();
    }
    if (old !== data) {
        fs.writeFileSync(file, data);
        return true;
    }
    return false;
};

const fetchData = (file: string) => {
    return new Promise((async resolve => {
        const stream = fs.createWriteStream(file);
        got.stream(url).pipe(stream);
        stream.on('finish', resolve);
    }));
};

const parseData = async (file: string) => {
    return new Promise(((resolve, reject) => {
        pdf_table_extractor(file, resolve, reject);
    }));
};

const extractData = async (data: any) => {
    return new Promise((resolve, reject) => {
        const out = {
            years: <any>[],
            data: <Array<{
                name: string,
                info: string,
                start: {
                    date: string,
                    time: string
                },
                end: {
                    date: string,
                    time: string
                }
            }>>[]
        };
        data.pageTables[0].tables[0][0].split('\n').forEach((line: string) => {
            if (line.includes('Ferienordnung')) {
                out.years = line.replace('Ferienordnung ', '').split(' ')[0].split('/').map(year => {
                    return parseInt(year);
                });
                out.years[1] = parseInt(out.years[0].toString().substring(0, 2) + out.years[1].toString());
            }
        });
        const lines = data.pageTables[0].tables[2][0].split('\n').filter((line: string) => {
            return line.trim() !== '';
        }).map((line: string) => {
            return line.trim();
        });
        getHolidays(data.pageTables[0].tables[1][0].split('\n').slice(1));
        getOpenDoorDay(lines);
        getFreeDays(lines);
        getConsultationDays(lines);
        getGradeReleases(lines);
        getConferences(lines);
        resolve(out);

        function getConferences(lines: Array<string>) {
            lines = lines.join('\n').split('Zeugniskonferenzen:')[1].split('Pädagogischer Tag und Kollegiumstagung:')[0].split('\n');
            lines.shift();
            lines.pop();
            lines.forEach((line, i) => {
                lines[i] = line.replace(' ', '');
            });
            lines = lines.filter(line => {
                line = line.trim();
                return !line.startsWith('Beratungskonferenzen') && !line.startsWith('Zeugnisausgabe');
            });
            lines.forEach(line => {
                while (line.includes('  ')) {
                    line = line.replace('  ', ' ');
                }
                if (/^[0-9]/m.test(line)) {
                    line = line.split('. ')[0];
                    let b = line.split(' und ')[0];
                    const a = b.split('/')[0] + b.split('/')[1].split('.').slice(1).join('.');
                    b = b.split('/')[1];
                    let d = line.split(' und ')[1];
                    const c = d.split('/')[0] + d.split('/')[1].split('.').slice(1).join('.');
                    d = d.split('/')[1];
                    const dates = [a, b, c, d];
                    dates.forEach(date => {
                        out.data.push({
                            name: 'Beratungskonferenz',
                            info: 'Kurzstunden',
                            start: {
                                date,
                                time: ''
                            },
                            end: {
                                date,
                                time: ''
                            }
                        });
                    });
                } else {
                    const day = line.split(' ')[1].replace('.', '');
                    const month = monthToInt(line.split(' ')[2]);
                    const year = line.split(' ')[3];
                    const rest = line.split(' ').slice(4).join(' ');
                    const name = rest.split('), ').slice(1).join(' ');
                    out.data.push({
                        name,
                        info: '',
                        start: {
                            date: day + '.' + month + '.' + year,
                            time: ''
                        },
                        end: {
                            date: day + '.' + month + '.' + year,
                            time: ''
                        }
                    });
                }
            });
        }

        function getGradeReleases(lines: Array<string>) {
            lines = lines.filter((line: string) => {
                return line.includes('Zeugnisausgabe');
            });
            lines.forEach((line: string) => {
                line = line.replace('Zeugnisausgabe:', '').replace(/zu Beginn der [0-9]\. Stunde/, '').trim();
                while (line.includes('  ')) {
                    line = line.replace('  ', ' ');
                }
                line = line.split(' ').slice(1).join(' ');
                const day = line.split(' ')[1].replace('.', '');
                const month = monthToInt(line.split(' ')[2]);
                const year = line.split(' ')[3];
                const schoolOff = line.split(' ').slice(4).join(' ').replace(/[()]/g, '');
                out.data.push({
                    name: 'Zeugnisausgabe',
                    info: schoolOff,
                    start: {
                        date: day + '.' + month + '.' + year,
                        time: ''
                    },
                    end: {
                        date: day + '.' + month + '.' + year,
                        time: ''
                    }
                });
            });
        }

        function getConsultationDays(lines: Array<string>) {
            lines = lines.join('\n').split('Sprechtage').slice(1)[0].split('\n');
            lines.forEach((line: string) => {
                if (/^[0-9]\. /m.test(line)) {
                    line = line.replace(/^[0-9]\. /, '').trim();
                    const description = line.includes('Monitasprechtag') ? 'Monitasprechtag' : 'Elternsprechtag';
                    line = line.replace(': Monitasprechtag', '');
                    const days = [];
                    if (line.includes('und')) {
                        const date1 = line.split(' und ')[0];
                        const date2 = line.split(' und ')[1];
                        const time = date2.split(' ').slice(4).join(' ').replace(/(\(|\))/g, '').replace('Uhr', '').replace(/\./g, ':').trim();
                        const time1 = time.split(' – ')[0];
                        const time2 = time.split(' – ')[1];
                        out.data.push({
                            name: description,
                            info: '',
                            start: {
                                date: date1.split(' ')[1].replace('.', '') + '.' + monthToInt(date1.split(' ')[2]) + '.' + date1.split(' ')[3],
                                time: time1
                            },
                            end: {
                                date: date1.split(' ')[1].replace('.', '') + '.' + monthToInt(date1.split(' ')[2]) + '.' + date1.split(' ')[3],
                                time: time2
                            }
                        });
                        out.data.push({
                            name: description,
                            info: '',
                            start: {
                                date: date2.split(' ')[1].replace('.', '') + '.' + monthToInt(date2.split(' ')[2]) + '.' + date2.split(' ')[3],
                                time: time1
                            },
                            end: {
                                date: date2.split(' ')[1].replace('.', '') + '.' + monthToInt(date2.split(' ')[2]) + '.' + date2.split(' ')[3],
                                time: time2
                            }
                        });
                    } else {
                        const date = line;
                        const time = date.split(' ').slice(4).join(' ').replace(/(\(|\))/g, '').replace('Uhr', '').replace(/\./g, ':').trim();
                        if (time.includes('–')) {
                            out.data.push({
                                name: description,
                                info: '',
                                start: {
                                    date: date.split(' ')[1].replace('.', '') + '.' + monthToInt(date.split(' ')[2]) + '.' + date.split(' ')[3],
                                    time: time.split(' – ')[0]
                                },
                                end: {
                                    date: date.split(' ')[1].replace('.', '') + '.' + monthToInt(date.split(' ')[2]) + '.' + date.split(' ')[3],
                                    time: time.split(' – ')[1]
                                }
                            });
                        } else {
                            out.data.push({
                                name: description,
                                info: time,
                                start: {
                                    date: date.split(' ')[1].replace('.', '') + '.' + monthToInt(date.split(' ')[2]) + '.' + date.split(' ')[3],
                                    time: ''
                                },
                                end: {
                                    date: date.split(' ')[1].replace('.', '') + '.' + monthToInt(date.split(' ')[2]) + '.' + date.split(' ')[3],
                                    time: ''
                                }
                            });
                        }
                    }
                }
            });
        }

        function getFreeDays(lines: Array<string>) {
            const lines1 = lines.join('\n').split('Sprechtage')[0].split('\n');
            lines1.forEach((line: string) => {
                if (/^[0-9]\. /m.test(line)) {
                    line = line.replace(/^[0-9]\. /, '').trim();
                    const weekday = line.split(' ')[0].replace(',', '');
                    const day = line.split(' ')[1].replace('.', '');
                    const month = line.split(' ')[2];
                    const year = line.split(' ')[3];
                    const description = (weekday.toLowerCase().includes('karneval') ? weekday : line.split(' ').slice(4).join(' ').replace(/[()]/g, ''));
                    out.data.push({
                        name: description,
                        info: '',
                        start: {
                            date: day + '.' + monthToInt(month) + '.' + year,
                            time: ''
                        },
                        end: {
                            date: day + '.' + monthToInt(month) + '.' + year,
                            time: ''
                        }
                    });
                }
            });
            let lines2 = lines.join('\n').split('Pädagogischer Tag und Kollegiumstagung:')[1].split('\n').slice(1);
            lines2.forEach((line: string) => {
                if (line.startsWith(' ')) {
                    line = line.slice(2);
                    while (line.includes('  ')) {
                        line = line.replace('  ', ' ');
                    }
                    let description = line.split(': ')[0];
                    if (/[0-9]$/m.test(description)) {
                        description = description.slice(0, -1);
                    }
                    if (line.includes('voraussichtlich')) {
                        description += ' (voraussichtlich)';
                        line = line.replace(' voraussichtlich', '');
                    }
                    line = line.split(': ')[1];
                    const day = line.split(' ')[1].replace('.', '');
                    const month = line.split(' ')[2];
                    const year = line.split(' ')[3].replace('.', '');
                    out.data.push({
                        name: description,
                        info: '',
                        start: {
                            date: day + '.' + monthToInt(month) + '.' + year,
                            time: ''
                        },
                        end: {
                            date: day + '.' + monthToInt(month) + '.' + year,
                            time: ''
                        }
                    });
                }
            });
        }

        function getOpenDoorDay(lines: Array<string>) {
            let openDoorDay = (<any>lines).find((line: string) => {
                return line.includes('Unterricht am Tag der Offenen Tür für künftige Fünftklässler und deren Eltern.');
            }).replace(': Unterricht am Tag der Offenen Tür für künftige Fünftklässler und deren Eltern.', '');
            let openDoorDayReplacement = (<any>lines).find((line: string) => {
                return line.includes('Dafür ist unterrichtsfrei am');
            }).replace('Dafür ist unterrichtsfrei am ', '').replace(', dem', '').slice(0, -1);
            out.data.push({
                name: 'Tag der Offenen Tür',
                info: '',
                start: {
                    date: openDoorDay.split('.')[0] + '.' + openDoorDay.split('.')[1] + '.' + openDoorDay.split('.')[2],
                    time: ''
                },
                end: {
                    date: openDoorDay.split('.')[0] + '.' + openDoorDay.split('.')[1] + '.' + openDoorDay.split('.')[2],
                    time: ''
                }
            });
            out.data.push({
                name: 'Ersatz für Tag der Offenen Tür',
                info: '',
                start: {
                    date: openDoorDayReplacement.split(' ')[1].replace('.', '') + '.' + monthToInt(openDoorDayReplacement.split(' ')[2]) + '.' + openDoorDayReplacement.split(' ')[3],
                    time: ''
                },
                end: {
                    date: openDoorDayReplacement.split(' ')[1].replace('.', '') + '.' + monthToInt(openDoorDayReplacement.split(' ')[2]) + '.' + openDoorDayReplacement.split(' ')[3],
                    time: ''
                }
            });
        }

        function getHolidays(lines: Array<string>) {
            lines.forEach((line: string) => {
                const name = line.split(' ')[0];
                let rest = line.slice(line.split(' ')[0].length).trim();
                while (rest.includes('  ')) {
                    rest = rest.replace('  ', ' ');
                }
                const arr = rest.split(' ');
                let start: any = arr.slice(0, 4);
                let end: any = arr.slice(4, arr.length);
                if (end.length > 0) {
                    end = {
                        date: end[1].replace('.', '') + '.' + monthToInt(end[2]) + '.' + end[3],
                        time: ''
                    };
                } else {
                    end = {};
                }
                out.data.push({
                    name,
                    info: 'Ferien',
                    start: {
                        date: start[1].replace('.', '') + '.' + monthToInt(start[2]) + '.' + start[3],
                        time: ''
                    },
                    end
                });
            });
        }
    });
};

const extractExternalData = (data: any) => {
    return new Promise(resolve => {
        let list: any = [];
        let reached = 0;
        data.years.forEach(async (year: number) => {
            const url = 'https://feiertage-api.de/api/?jahr=' + year + '&nur_land=NW';
            const response = JSON.parse((await got(url)).body);
            list = list.concat(Object.keys(response).map((name: string) => {
                return {
                    name,
                    info: '',
                    start: {
                        date: response[name].datum.split('-')[2] + '.' + response[name].datum.split('-')[1] + '.' + response[name].datum.split('-')[0],
                        time: ''
                    },
                    end: {
                        date: response[name].datum.split('-')[2] + '.' + response[name].datum.split('-')[1] + '.' + response[name].datum.split('-')[0],
                        time: ''
                    }
                };
            }));
            reached++;
            if (reached === 2) {
                resolve(list);
            }
        });
    });
};

const monthToInt = (month: string) => {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return months.indexOf(month) + 1;
};

(async () => {
    const file = path.resolve(process.cwd(), 'out', 'calendar', 'list.pdf');
    await fetchData(file);
    console.log('Fetched calendar');
    const data = await parseData(file);
    console.log('Parsed calendar');
    if (isNew(url)) {
        const calendar1: any = await extractData(data);
        const calendar2 = await extractExternalData(calendar1);
        console.log('Fetched external calendar');
        console.log('Parsed external calendar');
        calendar1.data = calendar1.data.concat(calendar2);
        fs.writeFileSync(path.resolve(process.cwd(), 'out', 'calendar', 'calendar.json'), JSON.stringify(calendar1, null, 2));
        console.log('Saved calendar');
    }
})();
