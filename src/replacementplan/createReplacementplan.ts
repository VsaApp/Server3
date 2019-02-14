import fs from 'fs';
import path from 'path';
import {getRoom} from '../rooms';
import {getSubject} from "../subjects";

export const extractData = async (data: any) => {
    const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2'];
    return await grades.map(grade => {
        const d: any = [];
        const u: any = [];
        let stop = false;

        // Get dates
        let weektype = '';
        let date = new Date(2000, 0);
        let weekday = '?';
        try {
            if (data.querySelectorAll('div')[0].childNodes[0].rawText.substr(1).includes('-Klassen-Vertretungsplan für ')) weektype = data.querySelectorAll('div')[0].childNodes[0].rawText.substr(0, 1);
            const dateStr = data.querySelectorAll('div')[0].childNodes[0].rawText.substr(1).replace('-Klassen-Vertretungsplan für ', '').replace('Januar', 'January').replace('Februar', 'February').replace('März', 'March').replace('Mai', 'May').replace('Juni', 'June').replace('Juli', 'July').replace('Oktober', 'October').replace('Dezember', 'December');
            date = new Date(dateStr);
            date.setHours(date.getHours() + 1);
            weekday = dateStr.split(', ')[0];
        } catch (e) {
            console.error('Cannont get the \'for\' date of the replacement plan', e.toString());
        }
        let update = new Date().getUTCDate().toString() + '.' + (new Date().getUTCMonth() + 1).toString() + '.' + new Date().getUTCFullYear().toString();
        let updateTime = new Date().getUTCMinutes().toString() + ':' + new Date().getUTCHours().toString();
        try {
            update = data.querySelectorAll('div')[1].childNodes[0].rawText.split('um')[0].trim().split(' den ')[1].trim();
            updateTime = data.querySelectorAll('div')[1].childNodes[0].rawText.split('um')[1].trim();
        } catch (e) {
            console.error('Cannont get the \'update\' date of the replacement plan', e.toString());
        }

        // Parse changes
        try {
            data.querySelectorAll('tr').forEach((row: any, i: number) => {
                    if (!stop) {
                        try {
                            if (row.childNodes.length === 3) {
                                if (row.childNodes[0].childNodes[0].childNodes[0].rawText.startsWith(grade)) {
                                    let rows = [row];
                                    let j = i + 1;
                                    while (true) {
                                        if (j >= data.querySelectorAll('tr').length) {
                                            break;
                                        }
                                        if (data.querySelectorAll('tr')[j].childNodes[0] === undefined) {
                                            break;
                                        }
                                        if (data.querySelectorAll('tr')[j].childNodes[0].childNodes[0] === undefined) {
                                            break;
                                        }
                                        if (!data.querySelectorAll('tr')[j].childNodes[0].childNodes[0].childNodes[0].rawText.startsWith('···')) {
                                            break;
                                        }
                                        rows.push(data.querySelectorAll('tr')[j]);
                                        j++;
                                    }
                                    rows.filter((r: any) => r.childNodes.length === 3).forEach(r => {
                                        let parsed = false;
                                        let unit = -1;
                                        let original: any = [];
                                        let changed: any = [];
                                        try {
                                            unit = parseInt(r.childNodes[0].childNodes.map((a: any) => a.childNodes[0].rawText)[0].split(' ')[1].slice(0, -1)) - 1;
                                            original = r.childNodes[1].childNodes.map((a: any) => a.childNodes[0].rawText.replace(/(\(|\)|\*\*\*| +(?= ))/g, '').trim());
                                            try {
                                                changed = r.childNodes[2].childNodes.map((a: any) => a.childNodes[0].rawText.trim());
                                            } catch (e) {
                                                console.log(r.childNodes, update, updateTime);
                                            }
                                            while (original.length < 2) {
                                                original.push('');
                                            }
                                            while (changed.length < 2) {
                                                changed.push('');
                                            }
                                            original = original.map((a: string) => {
                                                while (a.includes('  ')) {
                                                    a = a.replace('  ', ' ');
                                                }
                                                return a;
                                            });
                                            changed = changed.map((a: string) => {
                                                while (a.includes('  ')) {
                                                    a = a.replace('  ', ' ');
                                                }
                                                return a;
                                            });
                                            if (changed[0].includes('m.Aufg.')) {
                                                if ((original[0].match(/ /g) || []).length > 1) {
                                                    if (original[0].includes('abc')) {
                                                        if (changed[1].split(' ').length === 2) {
                                                            d.push({
                                                                unit: unit,
                                                                subject: original[0].split(' ')[1],
                                                                course: original[0].split(' ')[2],
                                                                room: original[1],
                                                                participant: '',
                                                                change: {
                                                                    subject: changed[1].split(' ')[1],
                                                                    teacher: changed[0].split(' ')[0],
                                                                    room: '',
                                                                    info: changed[0].split(' ')[1]
                                                                }
                                                            });
                                                        } else {
                                                            d.push({
                                                                unit: unit,
                                                                subject: original[0].split(' ')[1],
                                                                course: original[0].split(' ')[2],
                                                                room: original[1],
                                                                participant: '',
                                                                change: {
                                                                    subject: changed[1].split(' ')[1],
                                                                    teacher: changed[0].split(' ')[0],
                                                                    room: changed[1].split(' ')[2],
                                                                    info: changed[0].split(' ')[1]
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        if (changed[1].split(' ').length === 2) {
                                                            d.push({
                                                                unit: unit,
                                                                subject: original[0].split(' ')[1],
                                                                course: original[0].split(' ')[2],
                                                                room: original[1],
                                                                participant: '',
                                                                change: {
                                                                    subject: changed[1].split(' ')[1],
                                                                    teacher: changed[0].split(' ')[0],
                                                                    room: '',
                                                                    info: changed[0].split(' ')[1]
                                                                }
                                                            });
                                                        } else {
                                                            d.push({
                                                                unit: unit,
                                                                subject: original[0].split(' ')[1],
                                                                course: original[0].split(' ')[2],
                                                                room: original[1],
                                                                participant: '',
                                                                change: {
                                                                    subject: changed[1].split(' ')[1],
                                                                    teacher: changed[0].split(' ')[0],
                                                                    room: changed[1].split(' ')[2],
                                                                    info: changed[0].split(' ')[1]
                                                                }
                                                            });
                                                        }
                                                    }
                                                } else {
                                                    if (changed[1].split(' ').length === 2) {
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[0].split(' ')[0],
                                                            course: '',
                                                            room: original[0].split(' ')[1],
                                                            participant: '',
                                                            change: {
                                                                subject: changed[1].split(' ')[1],
                                                                teacher: changed[0].split(' ')[0],
                                                                room: '',
                                                                info: changed[0].split(' ')[1]
                                                            }
                                                        });
                                                    } else {
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[0].split(' ')[0],
                                                            course: '',
                                                            room: original[0].split(' ')[1],
                                                            participant: '',
                                                            change: {
                                                                subject: changed[1].split(' ')[1],
                                                                teacher: changed[0].split(' ')[0],
                                                                room: changed[1].split(' ')[2],
                                                                info: changed[0].split(' ')[1]
                                                            }
                                                        });
                                                    }
                                                }
                                                parsed = true;
                                            }
                                            if (changed[0].includes('Studienzeit')) {
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1],
                                                    course: original[0].split(' ')[2],
                                                    room: original[1],
                                                    participant: '',
                                                    change: {
                                                        subject: '',
                                                        teacher: '',
                                                        room: '',
                                                        info: 'Freistunde'
                                                    }
                                                });
                                                parsed = true;
                                            }
                                            if (changed[0].includes('abgehängt') || changed[0].includes('U-frei')) {
                                                if ((original[0].match(/ /g) || []).length > 1) {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[1],
                                                        course: original[0].split(' ')[2],
                                                        room: original[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: '',
                                                            info: 'Freistunde'
                                                        }
                                                    });
                                                } else {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[0],
                                                        course: '',
                                                        room: original[0].split(' ')[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: '',
                                                            info: 'Freistunde'
                                                        }
                                                    });
                                                }
                                                parsed = true;
                                            }
                                            if (original[0].includes('Klausur')) {
                                                original.shift();
                                                if (original[0] === 'Nachschreiber') {
                                                    d.push({
                                                        unit: unit,
                                                        subject: '',
                                                        course: '',
                                                        room: '',
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: original[1].split(': Aufsicht in ')[0],
                                                            room: original[1].split(': Aufsicht in ')[1],
                                                            info: 'Klausurnachschreiber'
                                                        }
                                                    });
                                                } else {
                                                    for (let k = 0; k < original.length - 1; k++) {
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[k].split(' ')[2],
                                                            course: original[k].split(' ')[3],
                                                            room: '',
                                                            participant: original[k].split(' ')[1],
                                                            change: {
                                                                subject: original[k].split(' ')[2],
                                                                teacher: original[original.length - 1].split(': Aufsicht in ')[0],
                                                                room: original[original.length - 1].split(': Aufsicht in ')[1],
                                                                info: 'Klausur'
                                                            }
                                                        });
                                                    }
                                                }
                                                parsed = true;
                                            }
                                            if (changed[0] === '' && changed[1] === '' && (original[1].match(/ /g) || []).length === 0) {
                                                if (original[0].split(' ').length === 3) {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[1],
                                                        course: original[0].split(' ')[2],
                                                        room: original[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: '',
                                                            info: (original.length === 2 ? 'Freistunde' : original[2])
                                                        }
                                                    });
                                                } else {
                                                    if (original[1] === 'Ersatzbereitschaft') {
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[0].split(' ')[0],
                                                            course: '',
                                                            room: original[0].split(' ')[1],
                                                            participant: '',
                                                            change: {
                                                                subject: '',
                                                                teacher: '',
                                                                room: '',
                                                                info: original[1]
                                                            }
                                                        });
                                                    } else {
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[0].split(' ')[1],
                                                            course: '',
                                                            room: original[1],
                                                            participant: '',
                                                            change: {
                                                                subject: '',
                                                                teacher: '',
                                                                room: '',
                                                                info: (original.length === 2 ? 'Freistunde' : original[2])
                                                            }
                                                        });
                                                    }
                                                }
                                                parsed = true;
                                            }
                                            if (changed[0] === 'Referendar(in)') {
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1],
                                                    course: (original[0].split(' ').length === 3 ? original[0].split(' ')[2] : ''),
                                                    room: original[1],
                                                    participant: '',
                                                    change: {
                                                        subject: '',
                                                        teacher: '',
                                                        room: '',
                                                        info: changed[0]
                                                    }
                                                });
                                                parsed = true;
                                            }
                                            if (changed[0].includes('R-Ändg.')) {
                                                if (original[1].length) {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[1],
                                                        course: original[0].split(' ')[2],
                                                        room: original[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: changed[0].split(' ')[1],
                                                            info: changed[0].split(' ')[0]
                                                        }
                                                    });
                                                } else {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[0],
                                                        course: '',
                                                        room: original[0].split(' ')[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: changed[0].split(' ')[1],
                                                            info: changed[0].split(' ')[0]
                                                        }
                                                    });
                                                }
                                                parsed = true;
                                            }
                                            if (changed[0].includes('Aufs.aus')) {
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1],
                                                    course: original[0].split(' ')[2],
                                                    room: original[1],
                                                    participant: '',
                                                    change: {
                                                        subject: '',
                                                        teacher: changed[0].split(' ')[0],
                                                        room: changed[0].split('R.')[1],
                                                        info: 'Aufsicht aus'
                                                    }
                                                });
                                                parsed = true;
                                            }
                                            if (original[0].includes('nach')) {
                                                if (changed[0] === 'abghgt. versch.') {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[0],
                                                        course: '',
                                                        room: original[0].split(' ')[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: '',
                                                            info: 'Verschoben nach ' + original[0].split(' ')[3] + ' ' + original[0].split(' ')[4]
                                                        }
                                                    });
                                                    parsed = true;
                                                } else if (changed[0].includes('mit')) {
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[0],
                                                        course: '',
                                                        room: original[0].split(' ')[1],
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: '',
                                                            info: 'Verschoben nach ' + original[0].split(' ')[3] + ' ' + original[0].split(' ')[4]
                                                        }
                                                    });
                                                    parsed = true;
                                                }
                                            }
                                            if (changed[0].includes('v.') && changed[0].includes('mit')) {
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[0],
                                                    course: '',
                                                    room: original[0].split(' ')[1],
                                                    participant: '',
                                                    change: {
                                                        subject: changed[1].split(' ')[1],
                                                        teacher: changed[0].split(' ')[0],
                                                        room: changed[1].split(' ')[2],
                                                        info: 'Verschoben von ' + changed[0].split(' ')[2] + ' ' + changed[0].split(' ')[3]
                                                    }
                                                });
                                                parsed = true;
                                            }
                                            if (original[0].includes('Block')) {
                                                for (let k = 2; k < original.length; k += 2) {
                                                    const text = (original[k] + ' ' + original[k + 1]).split(' ');
                                                    d.push({
                                                        unit: unit,
                                                        subject: text[0],
                                                        course: '',
                                                        room: text[2],
                                                        participant: '',
                                                        change: {
                                                            subject: changed[1].split(' ')[1],
                                                            teacher: changed[1].split(' ')[2],
                                                            room: changed[1].split(' ')[3],
                                                            info: changed[0]
                                                        }
                                                    });
                                                }
                                                parsed = true;
                                            }
                                        } catch (e) {
                                            console.error(grade, date, original, changed, e);
                                        }
                                        if (!parsed) {
                                            let text = '';
                                            let file = path.resolve(process.cwd(), 'out', 'replacementplan', 'unparsed.txt');
                                            if (fs.existsSync(file)) {
                                                text = fs.readFileSync(file, 'utf-8');
                                            }
                                            original = original.map((a: string) => {
                                                while (a.includes('  ')) {
                                                    a = a.replace('  ', ' ');
                                                }
                                                return a;
                                            });
                                            changed = changed.map((a: string) => {
                                                while (a.includes('  ')) {
                                                    a = a.replace('  ', ' ');
                                                }
                                                return a;
                                            });
                                            const n = grade + '\n' + JSON.stringify(original) + '\n' + JSON.stringify(changed) + '\n';
                                            // Try to get unit
                                            let unit = '-1';
                                            try {
                                                const leftColumn = data.querySelectorAll('tr')[j - 1].childNodes[0].childNodes[0].childNodes[0].rawText;
                                                unit = leftColumn.split(' ')[leftColumn.split(' ').length - 1].replace('.', '').trim();
                                            } catch (e) {
                                                console.error(grade, date, e);
                                            }
                                            u.push({
                                                unit: unit,
                                                original: original,
                                                change: changed
                                            });
                                            if (!text.includes(n)) {
                                                text += n;
                                                console.log('New unparsed found:');
                                                console.log(grade);
                                                console.log(original);
                                                console.log(changed);
                                                console.log();
                                            }
                                            fs.writeFileSync(file, text);
                                        }
                                    });
                                }
                            }
                        } catch (e) {
                            console.error(grade, date, row, e);
                        }
                    }
                }
            );
        } catch (e) {
            console.error('Cannot find \'tr\' selectors', e.toString());
        }
        for (let l = 0; l < d.length; l++) {
            d[l].subject = d[l].subject.replace(/PJ.+/g, 'PJ').replace(/[0-9]/g, '');
            d[l].change.subject = d[l].change.subject.replace(/PJ.+/g, 'PJ').replace(/[0-9]/g, '');
            d[l].subject = getSubject(d[l].subject);
            d[l].course = d[l].course.trim().toUpperCase();
            d[l].room = getRoom(d[l].room);
            d[l].participant = d[l].participant.trim().toUpperCase();
            d[l].change.subject = getSubject(d[l].change.subject);
            d[l].change.room = getRoom(d[l].change.room);
            d[l].change.teacher = d[l].change.teacher.trim().toUpperCase();
            d[l].change.info = d[l].change.info.trim();
        }

        return {
            participant: grade,
            for: {
                date: date.getUTCDate() + '.' + (date.getUTCMonth() + 1) + '.' + date.getUTCFullYear(),
                weekday: weekday,
                weektype: weektype
            },
            updated: {
                date: update,
                time: updateTime
            },
            data: d,
            unparsed: u
        }
    });
};
