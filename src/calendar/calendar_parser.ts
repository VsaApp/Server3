import got from 'got';
import { Calendar, Event } from '../utils/interfaces';
import localizations from '../utils/localizations';

/**
 * Extracts the calendar from raw html object
 * @param data raw html
 */
export const extractData = async (data: any): Promise<Calendar> => {
    return new Promise((resolve, reject) => {
        const out: Calendar = {
            years: [],
            data: []
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
                line = line.replace(/  +/g, ' ');
                if (/^[0-9]/m.test(line)) {
                    line = line.split('. ')[0];
                    let b = line.split(' und ')[0];
                    const a = b.split('/')[0] + b.split('/')[1].split('.').slice(b.split('/')[0].split('.').length - 1).join('.');
                    b = b.split('/')[1];
                    let d = line.split(' und ')[1];
                    const c = d.split('/')[0] + d.split('/')[1].split('.').slice(d.split('/')[0].split('.').length - 1).join('.');
                    d = d.split('/')[1];
                    const dates = [a, b, c, d];
                    dates.forEach(date => {
                        out.data.push({
                            name: 'Beratungskonferenz',
                            info: 'Kurzstunden',
                            start: stringToDate(date).toISOString(),
                            end: stringToDate(date).toISOString(),
                        });
                    });
                } else {
                    const rest = line.split(' ').slice(4).join(' ');
                    const name = rest.split('), ').slice(1).join(' ');
                    out.data.push({
                        name: name,
                        info: '',
                        start: stringToDate(line).toISOString(),
                        end: stringToDate(line).toISOString(),
                    });
                }
            });
        }

        function getGradeReleases(lines: Array<string>) {
            lines = lines.filter((line: string) => {
                return line.includes('Zeugnisausgabe');
            });
            lines.forEach((line: string) => {
                line = line.replace('Zeugnisausgabe:', '').replace(/zu Beginn der [0-9]\. Stunde/, '').replace(/  +/g, ' ').trim();
                line = line.split(' ').slice(1).join(' ');
                const schoolOff = line.split(' ').slice(4).join(' ').replace(/[()]/g, '');
                out.data.push({
                    name: 'Zeugnisausgabe',
                    info: schoolOff,
                    start: stringToDate(line).toISOString(),
                    end: stringToDate(line).toISOString(),
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
                    if (line.includes('und')) {
                        const date1 = line.split(' und ')[0];
                        const date2 = line.split(' und ')[1];
                        const time = date2.split(' ').slice(4).join(' ').replace(/(\(|\))/g, '').replace('Uhr', '').replace(/\./g, ':').trim();
                        const time1 = time.split('–')[0];
                        const time2 = time.split(' – ')[1];
                        out.data.push({
                            name: description,
                            info: '',
                            start: stringToDate(date1, time1).toISOString(),
                            end: stringToDate(date1, time2).toISOString(),
                        });
                        out.data.push({
                            name: description,
                            info: '',
                            start: stringToDate(date2, time1).toISOString(),
                            end: stringToDate(date2, time2).toISOString(),
                        });
                    } else {
                        const date = line;
                        const time = date.split(' ').slice(4).join(' ').replace(/(\(|\))/g, '').replace('Uhr', '').replace(/\./g, ':').trim();
                        if (time.includes('–')) {
                            out.data.push({
                                name: description,
                                info: '',
                                start: stringToDate(date, time.split('-')[0]).toISOString(),
                                end: stringToDate(date, time.split('-')[1]).toISOString(),
                            });
                        } else {
                            out.data.push({
                                name: description,
                                info: time,
                                start: stringToDate(date).toISOString(),
                                end: stringToDate(date).toISOString(),
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
                    const description = (weekday.toLowerCase().includes('karneval') ? weekday : line.split(' ').slice(4).join(' ').replace(/[()]/g, ''));
                    out.data.push({
                        name: description,
                        info: '',
                        start: stringToDate(line).toISOString(),
                        end: stringToDate(line).toISOString(),
                    });
                }
            });
            let lines2 = lines.join('\n').split('Pädagogischer Tag und Kollegiumstagung:')[1].split('\n').slice(1);
            lines2.forEach((line: string, i:number) => {
                if (line.startsWith(' ') && line.includes(':')) {
                    
                    line = line.slice(2).replace(/  +/g, ' ');
                    let description = line.split(': ')[0];
                    if (/[0-9]$/m.test(description)) {
                        description = description.slice(0, -1);
                    }
                    if (line.includes('voraussichtlich')) {
                        description += ' (voraussichtlich)';
                        line = line.replace(' voraussichtlich', '');
                    }
                    line = line.split(': ')[1];
                    out.data.push({
                        name: description,
                        info: '',
                        start: stringToDate(line).toISOString(),
                        end: stringToDate(line).toISOString(),
                    });
                }
                else if (line.length === 1 && !isNaN(parseInt(line)) && lines2.length > i + 1) {
                    lines2[i + 1] = lines2[i - 1] + lines2[i + 1];
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
                name: localizations.openDoorDay,
                info: '',
                start: stringToDate(openDoorDay).toISOString(),
                end: stringToDate(openDoorDay).toISOString(),
            });
            out.data.push({
                name: localizations.openDoorDayReplacement,
                info: '',
                start: stringToDate(openDoorDayReplacement).toISOString(),
                end: stringToDate(openDoorDayReplacement).toISOString(),
            });
        }

        function getHolidays(lines: Array<string>) {
            lines.forEach((line: string) => {
                const name = line.split(' ')[0];
                let rest = line.slice(line.split(' ')[0].length).replace(/  +/g, ' ').trim();
                const arr = rest.split(' ');
                let start: string = arr.slice(0, 4).join(' ');
                let end: string | undefined = arr.slice(4, arr.length).join(' ');
                if (end.length > 0) {
                    end = stringToDate(end).toISOString();
                } else {
                    end = undefined;
                }
                out.data.push({
                    name,
                    info: localizations.holidays,
                    start: stringToDate(start).toISOString(),
                    end: end
                });
            });
        }
    });
};

/**
 * Downloads and extracts all special dates for nrw/germany for the given [years]
 * @param years the years to extract
 */
export const extractExternalData = (years: number[]): Promise<Event[]> => {
    return new Promise(resolve => {
        let list: Event[] = [];
        let reached = 0;
        years.forEach(async (year: number) => {
            const url = 'https://feiertage-api.de/api/?jahr=' + year + '&nur_land=NW';
            const response = JSON.parse((await got(url)).body);
            list = list.concat(Object.keys(response).map((name: string): Event => {
                return {
                    name,
                    info: '',
                    start: stringToDate(response[name].datum, undefined, false).toISOString(),
                    end: stringToDate(response[name].datum, undefined, false).toISOString(),
                };
            }));
            reached++;
            if (reached === 2) {
                resolve(list);
            }
        });
    });
};

/**
 * Converts a german month string to an number (1 to 12)
 * @param month month string
 */
const monthToInt = (month: string): number => {
    const months = localizations.months;
    return months.indexOf(month) + 1;
};

/**
 * Parses a string to a date
 * @param raw date string
 * @param rawTime string
 * 
 * All supported date formats:
 * 
 * ````
 * '20.03.2019'
 * '2.1.19'
 * '..., 02.03.2019, ...'
 * 'Montag 02.03.2019'
 * 'Montag 02. März 2019'
 * '2-1-2019'
 * ````
 */
const stringToDate = (raw: string, rawTime?: string, germanFormat = true): Date => {
    if (raw.split(',').length > 2) raw = raw.split(',').slice(0, 2).join(',');
    // Replace all unused characters (./-/, and all weekdays)
    let fragments = raw
        .replace(/\.|-|.+,|.+m?M?ontag|.+d?D?ienstag|.+m?M?ittwoch|.+d?D?onnerstag|.+f?F?reitag|.+s?S?amstag|.+s?S?onntag/g, ' ')
        .replace(/  +/g, ' ')
        .trim()
        .split(' ')
        .slice(0, 3);
    // Convert month string to number
    if (isNaN(parseInt(fragments[1]))) {
        fragments[1] = monthToInt(fragments[1]).toString();
    }
    if (!germanFormat) fragments = fragments.reverse();
    const date = new Date(`${fragments[1]} ${fragments[0]} ${fragments[2]}`);

    // Convert time string to time
    if (rawTime) {
        const [hour, min] = rawTime.trim().split(':').slice(0, 2).map((i) => parseInt(i));
        date.setHours(hour, min);
    }
    return date;
}
