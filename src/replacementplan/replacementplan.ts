import fs from 'fs';
import path from 'path';
import config from '../config';
import got from 'got';
import { parse } from 'node-html-parser';

const fetchData = async (today: boolean) => {
    return (await got('https://www.viktoriaschule-aachen.de/sundvplan/vps/' + (today ? 'left' : 'right') + '.html', { auth: config.username + ':' + config.password })).body;
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
                            d.push({
                                unit: unit,
                                subject: original[0].split(' ')[0].toUpperCase(),
                                course: original[0].split(' ')[1].toUpperCase(),
                                room: original[1].toUpperCase(),
                                teacher: '',
                                change: {
                                    subject: changed[1].split(' ')[1].toUpperCase(),
                                    teacher: changed[0].split(' ')[0],
                                    room: changed[1].split(' ')[2].toUpperCase(),
                                    info: changed[0].split(' ')[1]
                                }
                            });
                        }
                        if (changed[0].includes('Studienzeit')) {
                            parsed = true;
                            d.push({
                                unit: unit,
                                subject: original[0].split(' ')[1].toUpperCase(),
                                course: original[0].split(' ')[2].toUpperCase(),
                                room: original[1].toUpperCase(),
                                teacher: '',
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
                            d.push({
                                unit: unit,
                                subject: original[0].split(' ')[0].toUpperCase(),
                                course: '',
                                room: original[0].split(' ')[1].toUpperCase(),
                                teacher: '',
                                change: {
                                    subject: '',
                                    teacher: '',
                                    room: '',
                                    info: 'Freistunde'
                                }
                            });
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
                                    teacher: original[k].split(' ')[1].toUpperCase(),
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
                                teacher: '',
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
                                teacher: '',
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
                                teacher: '',
                                change: {
                                    subject: '',
                                    teacher: '',
                                    room: changed[0].split(' ')[1],
                                    info: changed[0].split(' ')[0]
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
        return {
            grade: grade,
            for: {
                date: data.querySelectorAll('div')[0].childNodes[0].rawText.split('für')[1].trim().split(',')[1].trim()
            },
            updated: {
                date: data.querySelectorAll('div')[1].childNodes[0].rawText.split('um')[0].trim().split(' den ')[1].trim(),
                time: data.querySelectorAll('div')[1].childNodes[0].rawText.split('um')[1].trim()
            },
            data: d
        }
    });
};

(async () => {
    fetchData(true).then(raw => {
        console.log('Fetched replacement plan for today');
        parseData(raw).then(data => {
            console.log('Parsed replacement plan for today');
            extractData(data).then(replacementplan => {
                console.log('Extracted replacement plan for today');
                replacementplan.forEach(data => {
                    fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'today', data.grade + '.json'), JSON.stringify(data, null, 2));
                });
                console.log('Saved replacement plan for today');
            });
        });
    });
    fetchData(false).then(raw => {
        console.log('Fetched replacement plan for tomorrow');
        parseData(raw).then(data => {
            console.log('Parsed replacement plan for tomorrow');
            extractData(data).then(replacementplan => {
                console.log('Extracted replacement plan for tomorrow');
                replacementplan.forEach(data => {
                    fs.writeFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'tomorrow', data.grade + '.json'), JSON.stringify(data, null, 2));
                });
                console.log('Saved replacement plan for tomorrow');
            });
        });
    });

})();
