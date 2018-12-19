import config from '../config';
import request from 'request';
import { parse } from 'node-html-parser';
import entities from 'entities';
import path from 'path';
import fs from 'fs';

const cli: boolean = module.parent === null;

const isNew = (data: any) => {
    let file = path.resolve(process.cwd(), 'out', 'cafetoria', 'date.txt');
    let old = '';
    if (fs.existsSync(file)) {
        old = fs.readFileSync(file, 'utf-8').toString();
    }
    let n = data.querySelector('.MPDatum').childNodes[0].childNodes[0].rawText;
    fs.writeFileSync(file, n);
    return old !== n;
};

export const fetchData = async (id: string, pin: string) => {
    return new Promise((resolve, reject) => {
        const cookieJar = request.jar();
        request.get({
            url: 'https://www.opc-asp.de/vs-aachen/',
            jar: cookieJar
        }, () => {
            request.post({
                url: 'https://www.opc-asp.de/vs-aachen/?LogIn=true',
                jar: cookieJar,
                form: {
                    sessiontest: (<any>cookieJar)._jar.store.idx['www.opc-asp.de']['/'].PHPSESSID.toString().split(';')[0].split('=')[1],
                    f_kartennr: id,
                    f_pw: pin
                }
            }, () => {
                request.get({
                    url: 'https://www.opc-asp.de/vs-aachen/menuplan.php?KID=' + id,
                    jar: cookieJar
                }, (error, response, body) => {
                    if (response.statusCode !== 200) {
                        reject({
                            error: 'Invalid credentials'
                        });
                        return;
                    }
                    resolve(body);
                });
            });
        });
    });
};

export const parseData = async (raw: string) => {
    return await parse(raw);
};

export const extractData = async (data: any) => {
    let saldo: any = parseFloat(data.querySelector('#saldoOld').childNodes[0].rawText.replace(',', '.'));
    if (cli) {
        saldo = null;
    }
    let dates = data.querySelectorAll('.MPDatum');
    dates = dates.map((a: any) => a.childNodes).map((b: any) => {
        return { weekday: b[2].rawText, date: b[0].childNodes[0].rawText };
    });
    const names = data.querySelectorAll('.angebot_text');
    const prices = data.querySelectorAll('.angebot_preis');
    return {
        saldo: saldo, error: null, days: dates.map((date: any) => {
            let menus: any = [];
            for (let i = 0; i < 4; i++) {
                menus.push({
                    name: entities.decodeHTML(names[dates.indexOf(date) * 4 + i].childNodes.length == 1 ? names[dates.indexOf(date) * 4 + i].childNodes[0].rawText : ''),
                    time: '',
                    price: prices[dates.indexOf(date) * 4 + i].childNodes.length == 1 ? parseFloat(prices[dates.indexOf(date) * 4 + i].childNodes[0].rawText.replace('&euro;', '').trim().replace(',', '.')) : 0
                });
            }
            menus = menus.filter((a: any) => a.name !== '');
            return {
                date: date.date,
                weekday: date.weekday,
                menus
            };
        })
    };
};

export const fetchDataForUser = async (id: string, pin: string) => {
    if (id === '' && pin === '') {
        return await JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'cafetoria', 'list.json'), 'utf-8'));
    } else {
        return new Promise((resolve, reject) => {
            fetchData(id, pin).then((raw: any) => {
                parseData(raw).then((data: any) => {
                    extractData(data).then((menus: any) => {
                        resolve(menus);
                    });
                });
            }).catch(reject);
        });
    }
};

if (module.parent === null) {
    (async () => {
        fetchData(config.cafetoriaId, config.cafetoriaPin).then((raw: any) => {
            console.log('Fetched menus');
            parseData(raw).then((data: any) => {
                console.log('Parsed menus');
                if (isNew(data)) {
                    extractData(data).then((menus: any) => {
                        console.log('Extracted menus');
                        fs.writeFileSync(path.resolve(process.cwd(), 'out', 'cafetoria', 'list.json'), JSON.stringify(menus.days, null, 2));
                        console.log('Saved menus');
                    });
                }
            });
        }).catch(() => {
            console.log('Wrong Cafetoria credentials');
        });
    })();
}