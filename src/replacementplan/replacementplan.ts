import fs from 'fs';
import path from 'path';
import config from '../config';
import got from 'got';
import {parse} from 'node-html-parser';

const isNew = (data: any, today: boolean) => {
    let file = path.resolve(process.cwd(), 'out', 'replacementplan', (today ? 'today' : 'tomorrow') + '.txt');
    let old = '';
    if (fs.existsSync(file)) {
        old = fs.readFileSync(file, 'utf-8').toString();
    }
    let n = data.querySelectorAll('div')[1].childNodes[0].rawText;
    fs.writeFileSync(file, n);
    return old !== n;
};

const fetchData = async (today: boolean) => {
    return (await got('https://www.viktoriaschule-aachen.de/sundvplan/vps/' + (today ? 'left' : 'right') + '.html', {auth: config.username + ':' + config.password})).body;
};

const parseData = async (raw: string) => {
    return await parse(raw);
};

const extractData = async (data: any) => {
    const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2'];
    return await grades.map(grade => {
        const d: any = [];
        let stop = false;
        data.querySelectorAll('tr').forEach((row: any, i: number) => {
            if (!stop) {
                if (row.childNodes[0].childNodes[0].childNodes[0].rawText.startsWith(grade)) {
                    let rows = [row];
                    let j = i + 1;
                    while (true) {
                        if (j >= data.querySelectorAll('tr').length) {
                            break;
                        }
                        if (!data.querySelectorAll('tr')[j].childNodes[0].childNodes[0].childNodes[0].rawText.startsWith('···')) {
                            break;
                        }
                        rows.push(data.querySelectorAll('tr')[j]);
                        j++;
                    }
                    rows.forEach(r => {
                        let unit = parseInt(r.childNodes[0].childNodes.map((a: any) => a.childNodes[0].rawText)[0].split(' ')[1].slice(0, -1)) - 1;
                        let original = r.childNodes[1].childNodes.map((a: any) => a.childNodes[0].rawText.replace(/(\(|\)|\*\*\*| +(?= ))/g, '').trim());
                        let changed = r.childNodes[2].childNodes.map((a: any) => a.childNodes[0].rawText.trim());
                        while (original.length < 2) {
                            original.push('');
                        }
                        while (changed.length < 2) {
                            changed.push('');
                        }
                        let parsed = false;
                        if (changed[0].includes('m.Aufg.')) {
                            parsed = true;
                            if ((original[0].match(/ /g) || []).length > 1) {
                                if (original[0].includes('abc')) {
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
                        }
                        if (changed[0].includes('Studienzeit')) {
                            parsed = true;
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
                        }
                        if (changed[0].includes('abgehängt')) {
                            parsed = true;
                            if ((original[0].match(/ /g) || []).length > 1) {
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
                        }
                        if (original[0].includes('Klausur')) {
                            parsed = true;
                            original.shift();
                            for (let k = 0; k < original.length - 1; k++) {
                                d.push({
                                    unit: unit,
                                    subject: original[k].split(' ')[2].toUpperCase(),
                                    course: original[k].split(' ')[3].toUpperCase(),
                                    room: '',
                                    participant: original[k].split(' ')[1].toUpperCase(),
                                    change: {
                                        subject: '',
                                        teacher: original[original.length - 1].split(': Aufsicht in ')[0],
                                        room: original[original.length - 1].split(': Aufsicht in ')[1],
                                        info: 'Klausur'
                                    }
                                });
                            }
                        }
                        if (changed[0] === '' && changed[1] === '' && (original[1].match(/ /g) || []).length === 0) {
                            parsed = true;
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
                        }
                        if (changed[0] === 'Referendar(in)') {
                            parsed = true;
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
                                    info: changed[0]
                                }
                            });
                        }
                        if (changed[0].includes('R-Ändg.')) {
                            parsed = true;
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
                        }
                        if (changed[0].includes('Aufs.aus')) {
                            parsed = true;
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
                        }
                        if (!parsed) {
                            let text = '';
                            let file = path.resolve(process.cwd(), 'out', 'replacementplan', 'unparsed.txt');
                            if (fs.existsSync(file)) {
                                text = fs.readFileSync(file, 'utf-8');
                            }
                            const n = grade + '\n' + JSON.stringify(original) + '\n' + JSON.stringify(changed) + '\n';
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
        });
        for (let l = 0; l < d.length; l++) {
            d[l].subject = d[l].subject.replace('NWB', 'NW').replace(/[0-9]/g, '');
            d[l].change.subject = d[l].change.subject.replace('NWB', 'NW').replace(/[0-9]/g, '');
        }
        const dateStr = data.querySelectorAll('div')[0].childNodes[0].rawText.substr(1).replace('-Klassen-Vertretungsplan für ', '').replace('Januar', 'January').replace('Februar', 'February').replace('März', 'March').replace('Mai', 'May').replace('Juni', 'June').replace('Juli', 'July').replace('Oktober', 'October').replace('Dezember', 'December');
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 1);
        const weekday = dateStr.split(', ')[0];
        return {
            participant: grade,
            for: {
                date: date.getUTCDate() + '.' + (date.getUTCMonth() + 1) + '.' + date.getUTCFullYear(),
                weekday: weekday
            },
            updated: {
                date: data.querySelectorAll('div')[1].childNodes[0].rawText.split('um')[0].trim().split(' den ')[1].trim(),
                time: data.querySelectorAll('div')[1].childNodes[0].rawText.split('um')[1].trim()
            },
            data: d
        }
    });
};

const createTeacherReplacementplan = async (data: any) => {
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

const send = async (segment: string, data: any) => {
    const dataString = {
        app_id: config.appId,
        included_segments: [segment],
        content_available: true,
        data: data
    };
    let url = 'https://onesignal.com/api/v1/notifications';
    const response = await got.post(
        url,
        {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': 'Basic ' + config.appAuthKey
            },
            body: JSON.stringify(dataString)
        });
    if (response.statusCode === 200) {
        return await response.body;
    } else {
        throw response.body;
    }
};

const updateUnitPlan = (data: any) => {
    const file = path.resolve(process.cwd(), 'out', 'unitplan', data.participant + '.json');
    let unitplan = JSON.parse(fs.readFileSync(file, 'utf-8'));
    data.data.forEach((change: any) => {
        const day = unitplan.data.filter((day: any) => {
            return data.for.weekday === day.weekday;
        })[0];
        const lesson = day.lessons[change.unit.toString()];
        if (lesson.length === 1) {
            lesson.course = change.course;
        }
        const matchingSubjects = lesson.filter((subject: any) => {
            return (subject.subject === change.subject || subject.room === change.room || subject.teacher === change.room) && change.change.info !== 'Klausur';
        });
        if (matchingSubjects.length === 1) {
            lesson[lesson.indexOf(matchingSubjects[0])].course = change.course;
        }
        const multiMatchingSubjects: any = [];
        unitplan.data.forEach((day: any) => {
            Object.keys(day.lessons).forEach((unit: string) => {
                const lesson = day.lessons[unit];
                if (lesson.length > 0) {
                    lesson.forEach((subject: any) => {
                        if (subject.subject === change.subject && subject.teacher === subject.teacher) {
                            multiMatchingSubjects.push(subject);
                        }
                    });
                }
            });
        });
        if (multiMatchingSubjects.length <= 3) {
            for (let m = 0; m < multiMatchingSubjects.length; m++) {
                multiMatchingSubjects[m].course = change.course;
            }
        }
    });
    fs.writeFileSync(file, JSON.stringify(unitplan, null, 2));
};

(async () => {
    fetchData(true).then(raw => {
        console.log('Fetched replacement plan for today');
        parseData(raw).then(data => {
            console.log('Parsed replacement plan for today');
            if (isNew(data, true)) {
                extractData(data).then(replacementplan1 => {
                    createTeacherReplacementplan(replacementplan1).then(replacementplan2 => {
                        console.log('Extracted replacement plan for today');
                        replacementplan1.concat(replacementplan2).forEach(async (data) => {
                            if (data.participant.length < 3) {
                                updateUnitPlan(data);
                            }
                            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'today', data.participant + '.json'), JSON.stringify(data, null, 2));
                            send(data.participant, {type: 'replacementplan', day: 'today'}).then(() => {
                                console.log('Send replacement plan for today to ' + data.participant);
                            }).catch((e: any) => {
                                console.log('Sending replacement plan for today to ' + data.participant + ' failed');
                                console.error(e);
                            });
                        });
                        console.log('Saved replacement plan for today');
                    });
                });
            }
        });
    });
    fetchData(false).then(raw => {
        console.log('Fetched replacement plan for tomorrow');
        parseData(raw).then(data => {
            console.log('Parsed replacement plan for tomorrow');
            if (isNew(data, false)) {
                extractData(data).then(replacementplan1 => {
                    createTeacherReplacementplan(replacementplan1).then(replacementplan2 => {
                        console.log('Extracted replacement plan for tomorrow');
                        replacementplan1.concat(replacementplan2).forEach(async (data) => {
                            if (data.participant.length < 3) {
                                updateUnitPlan(data);
                            }
                            fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'tomorrow', data.participant + '.json'), JSON.stringify(data, null, 2));
                            send(data.participant, {type: 'replacementplan', day: 'tomorrow'}).then(() => {
                                console.log('Send replacement plan for tomorrow to ' + data.participant);
                            }).catch((e: any) => {
                                console.log('Sending replacement plan for tomorrow to ' + data.participant + ' failed');
                                console.error(e);
                            });
                        });
                        console.log('Saved replacement plan for tomorrow');
                    });
                });
            }
        });
    });

})();
