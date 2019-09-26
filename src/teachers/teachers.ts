import config from '../config';
import got from 'got';
import {CookieJar} from 'tough-cookie';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import {getSubject} from '../subjects';
import {getUrl} from './teachers_url';

const PDFParser = require('pdf2json');

let url;

const isNew = (data: any) => {
    let file = path.resolve(process.cwd(), 'out', 'teachers', 'date.txt');
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
        const cookieJar = new CookieJar();
        const form = new FormData();
        form.append('username', config.username);
        form.append('password', config.password);
        await got('https://viktoriaschule-aachen.de/index.php', {
            cookieJar, body: form
        });
        const stream = fs.createWriteStream(file);
        url = await getUrl();
        got.stream(url, {
            auth: config.username + ':' + config.password,
            cookieJar
        }).pipe(stream);
        stream.on('finish', resolve);
    }));
};

const parseData = async (file: string) => {
    return new Promise(((resolve, reject) => {
        let pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', reject);
        pdfParser.on('pdfParser_dataReady', resolve);

        pdfParser.loadPDF(file);
    }));
};

const extractData = async (data: any) => {
    const list: any = [];
    data.formImage.Pages.forEach((page: any) => {
        let lines: any = [];
        let tempValues: any = [];

        page.Texts.forEach((rawText: any) => {
            const text = decodeURI(rawText.R[0].T);
            if ((text.includes('.') && text.length <= 3) || text === 'Fakultenliste') {

            } else if (text.length === 3 && text === text.toUpperCase()) {
                tempValues.push(text);
                lines.push(tempValues);
                tempValues = [];
            } else {
                tempValues.push(text);
            }
        });
        lines.forEach((line: any) => {
            let teacher: any = {
                //longName: '', Hug DSGVO
                shortName: '',
                subjects: []
            };
            for (let i = 0; i < line.length; i++) {
                const value = line[i].trim();
                if (value.length === 3 && value === value.toUpperCase()) {
                    teacher.shortName = value;
                } else if (value.length <= 2) {
                    teacher.subjects.push(getSubject(value));
                } else {
                    //teacher.longName = value; Hug DSGVO
                }
            }
            list.push(teacher);
        });
    });
    return list;
};

(async () => {
    const file = path.resolve(process.cwd(), 'out', 'teachers', 'list.pdf');
    await fetchData(file);
    console.log('Fetched teachers');
    const data = await parseData(file);
    console.log('Parsed teachers');
    if (isNew(url)) {
        fs.writeFileSync(path.resolve(process.cwd(), 'out', 'teachers', 'teachers.json'), JSON.stringify(await extractData(data), null, 2));
        console.log('Saved teachers');
    }
})();