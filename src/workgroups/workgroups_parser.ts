import {getRoomID} from '../utils/rooms';
import { WorkgroupsDay } from '../utils/interfaces';

(<any>Array.prototype).insert = function (index: number) {
    this.splice.apply(this, [index, 0].concat(
        Array.prototype.slice.call(arguments, 1)));
    return this;
};

const extractData = (data: any): WorkgroupsDay[] => {
    let list: WorkgroupsDay[] = [];
    let tables = data.pageTables[0].tables;
    tables.pop();
    tables.pop();
    tables = tables.map((d: any) => d.map((e: any) => e.split('\n').map((f: any) => f.trim())));
    tables.forEach((row: any, i: number) => {
        row.forEach((column: any, j: number) => {
            if (!column[0].toLowerCase().startsWith('bepa') && !column[0].toLowerCase().startsWith('ags')) {
                if (i === 0) {
                    column.forEach((inRow: string) => {
                        list.push({weekday: weekdayToNumber(inRow), data: []});
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
                        let place = getRoomID(column[3]
                            .toLowerCase()
                            .replace(/gr\.? ha(lle)?/g, 'GRH') // replace gr. Ha / gr. Halle / gr Ha / gr Halle
                            .replace(/kl\.? ha(lle)?/g, 'KLH') // replace kl. Ha / kl. Halle / kl Ha / kl Halle
                            .replace(/(r|R)(\.( +)?| +)|\(.+/g, '') // remove 'R.' / 'r.' / 'r ' / 'R ' / '(...'
                            .replace('aula', 'AUL')
                            .trim());
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

const weekdayToNumber = (weekday: string): number => {
    return ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'].indexOf(weekday.toLowerCase());
}

export default extractData;