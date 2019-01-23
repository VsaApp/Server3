import fs from 'fs';
import path from 'path';

export const extractData = async (data: any) => {
    const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2'];
    return await grades.map(grade => {
        const d: any = [];
        const u: any = [];
        let stop = false;

        // Get dates
        let date = new Date(2000, 0);
        let weekday = '?';
        try {
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
                                        if (data.querySelectorAll('tr')[j].childNodes[0].childNodes[0] === undefined) {
                                            break;
                                        }
                                        if (!data.querySelectorAll('tr')[j].childNodes[0].childNodes[0].childNodes[0].rawText.startsWith('···')) {
                                            break;
                                        }
                                        rows.push(data.querySelectorAll('tr')[j]);
                                        j++;
                                    }
                                    rows.forEach(r => {
                                        let parsed = false;
                                        let unit = -1;
                                        let original = [];
                                        let changed = [];
                                        let triedMethod;
                                        try {
                                            unit = parseInt(r.childNodes[0].childNodes.map((a: any) => a.childNodes[0].rawText)[0].split(' ')[1].slice(0, -1)) - 1;
                                            original = r.childNodes[1].childNodes.map((a: any) => a.childNodes[0].rawText.replace(/(\(|\)|\*\*\*| +(?= ))/g, '').trim());
                                            changed = r.childNodes[2].childNodes.map((a: any) => a.childNodes[0].rawText.trim());
                                            while (original.length < 2) {
                                                original.push('');
                                            }
                                            while (changed.length < 2) {
                                                changed.push('');
                                            }
                                            if (changed[0].includes('m.Aufg.')) {
                                                triedMethod = 0.0;
                                                if ((original[0].match(/ /g) || []).length > 1) {
                                                    if (original[0].includes('abc')) {
                                                        triedMethod = 0.1;
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[0].split(' ')[1].toUpperCase(),
                                                            course: original[0].split(' ')[2].toUpperCase(),
                                                            room: original[1].toUpperCase(),
                                                            participant: '',
                                                            change: {
                                                                subject: changed[1].split(' ')[1].toUpperCase(),
                                                                teacher: changed[0].split(' ')[0],
                                                                room: changed[1].split(' ')[2].toUpperCase(),
                                                                info: changed[0].split(' ')[1]
                                                            }
                                                        });
                                                    } else {
                                                        triedMethod = 0.2;
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[0].split(' ')[1].toUpperCase(),
                                                            course: original[0].split(' ')[2].toUpperCase(),
                                                            room: original[1].toUpperCase(),
                                                            participant: '',
                                                            change: {
                                                                subject: changed[1].split(' ')[1].toUpperCase(),
                                                                teacher: changed[0].split(' ')[0],
                                                                room: changed[1].split(' ')[2].toUpperCase(),
                                                                info: changed[0].split(' ')[1]
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    triedMethod = 1.0;
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[0].toUpperCase(),
                                                        course: '',
                                                        room: original[0].split(' ')[1].toUpperCase(),
                                                        participant: '',
                                                        change: {
                                                            subject: changed[1].split(' ')[1].toUpperCase(),
                                                            teacher: changed[0].split(' ')[0],
                                                            room: changed[1].split(' ')[2].toUpperCase(),
                                                            info: changed[0].split(' ')[1]
                                                        }
                                                    });
                                                }
                                                parsed = true;
                                            }
                                            if (changed[0].includes('Studienzeit')) {
                                                triedMethod = 2.0;
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1].toUpperCase(),
                                                    course: original[0].split(' ')[2].toUpperCase(),
                                                    room: original[1].toUpperCase(),
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
                                                triedMethod = 3.0;
                                                if ((original[0].match(/ /g) || []).length > 1) {
                                                    triedMethod = 3.1;
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[1].toUpperCase(),
                                                        course: original[0].split(' ')[2].toUpperCase(),
                                                        room: original[1].toUpperCase(),
                                                        participant: '',
                                                        change: {
                                                            subject: '',
                                                            teacher: '',
                                                            room: '',
                                                            info: 'Freistunde'
                                                        }
                                                    });
                                                } else {
                                                    triedMethod = 3.2;
                                                    d.push({
                                                        unit: unit,
                                                        subject: original[0].split(' ')[0].toUpperCase(),
                                                        course: '',
                                                        room: original[0].split(' ')[1].toUpperCase(),
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
                                                triedMethod = 4.0;
                                                original.shift();
                                                if (original[0] === 'Nachschreiber') {
                                                    triedMethod = 4.1;
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
                                                    triedMethod = 4.2;
                                                    for (let k = 0; k < original.length - 1; k++) {
                                                        d.push({
                                                            unit: unit,
                                                            subject: original[k].split(' ')[2].toUpperCase(),
                                                            course: original[k].split(' ')[3].toUpperCase(),
                                                            room: '',
                                                            participant: original[k].split(' ')[1].toUpperCase(),
                                                            change: {
                                                                subject: original[k].split(' ')[2].toUpperCase(),
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
                                                triedMethod = 5.0;
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1].toUpperCase(),
                                                    course: original[0].split(' ')[2].toUpperCase(),
                                                    room: original[1],
                                                    participant: '',
                                                    change: {
                                                        subject: '',
                                                        teacher: '',
                                                        room: '',
                                                        info: (original.length === 2 ? 'Freistunde' : original[2])
                                                    }
                                                });
                                                parsed = true;
                                            }
                                            if (changed[0] === 'Referendar(in)') {
                                                triedMethod = 6.0;
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1].toUpperCase(),
                                                    course: (original[0].split(' ').length === 3 ? original[0].split(' ')[2].toUpperCase() : ''),
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
                                                triedMethod = 7.0;
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1].toUpperCase(),
                                                    course: original[0].split(' ')[2].toUpperCase(),
                                                    room: original[1],
                                                    participant: '',
                                                    change: {
                                                        subject: '',
                                                        teacher: '',
                                                        room: changed[0].split(' ')[1],
                                                        info: changed[0].split(' ')[0]
                                                    }
                                                });
                                                parsed = true;
                                            }
                                            if (changed[0].includes('Aufs.aus')) {
                                                triedMethod = 8.0;
                                                d.push({
                                                    unit: unit,
                                                    subject: original[0].split(' ')[1].toUpperCase(),
                                                    course: original[0].split(' ')[2].toUpperCase(),
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
                                        } catch (e) {
                                            console.error(`Error during parse change in grade ${grade} row ${i} in subrow ${rows.indexOf(r)}`, `Trie to parse with method '${triedMethod}' (You can check them in the code)`, `Replacementplan for ${date} (${weekday})`, `Replacementplan from ${update} ${updateTime}`, `Time: ${Math.round((new Date()).getTime() / 1000).toString()}`, 'Row (raw):', r, 'Exception:' + e);
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
                                                console.error(`Cannot get unit for unparsed change (Grade: ${grade}, For: ${date}, Updated: ${update}, ${updateTime})`, e);
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
                            console.error(`Cannot parse row ${i}`, `(Grade: ${grade}, For: ${date}, Updated: ${update}, ${updateTime})`, 'Row (raw):', row, 'Exception:', e);
                        }
                    }
                }
            );
        } catch (e) {
            console.error('Cannot find \'tr\' selectors', e.toString());
        }
        for (let l = 0; l < d.length; l++) {
            d[l].subject = d[l].subject.replace('NWB', 'NW').replace('DFÖ', 'DF').replace('MINT', 'MI').replace(/[0-9]/g, '');
            d[l].change.subject = d[l].change.subject.replace('NWB', 'NW').replace(/[0-9]/g, '');
        }

        return {
            participant: grade,
            for: {
                date: date.getUTCDate() + '.' + (date.getUTCMonth() + 1) + '.' + date.getUTCFullYear(),
                weekday: weekday
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

export const createTeacherReplacementplan = async (data: any) => {
    let teachers = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'teachers', 'teachers.json')).toString());
    teachers = teachers.map((teacher: any) => teacher.shortName);
    teachers = teachers.map((teacher: string) => {
        let d: any = {
            participant: teacher,
            for: data[0].for,
            updated: data[0].updated,
            data: []
        };
        data.forEach((a: any) => {
            a.data.forEach((change: any) => {
                if (change.teacher === teacher || change.change.teacher === teacher) {
                    d.data.push({
                        'unit': change.unit,
                        'subject': change.subject,
                        'course': change.course,
                        'room': change.room,
                        'participant': a.participant,
                        'change': {
                            'subject': change.change.subject,
                            'teacher': change.change.teacher,
                            'room': change.change.room,
                            'info': change.change.info
                        }
                    });
                }
            });
        });
        return d;
    });
    return await teachers;
};
