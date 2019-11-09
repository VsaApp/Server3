import config from '../utils/config';
import request from 'request';
import {parse} from 'node-html-parser';
import extractData from './cafetoria_parser';
import path from 'path';
import fs from 'fs';
import { Cafetoria } from '../utils/interfaces';
import { getLatestCafetoria, setLatestCafetoria } from '../history/history';

const isDev = process.argv.length === 3;

/**
 * Compares the dates of the old and given data
 * @param data html [data] of the cafetoria website
 */
const isNew = (data: any): boolean => {
    const oldDate = getLatestCafetoria();
    const newDate = new Date(data.querySelector('.MPDatum').childNodes[0].childNodes[0].rawText.replace(/\./g, ' '));
    if (oldDate.getTime() !== newDate.getTime()) {
        setLatestCafetoria(newDate);
        return true;
    }
    return false;
};

/**
 * Fetches html for keyfop
 * @param id of the keyfop
 * @param pin of the keyfop
 */
const fetchData = async (id: string, pin: string): Promise<string> => {
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
                            error: 'Invalid cafetoria credentials'
                        });
                        return;
                    }
                    resolve(body);
                });
            });
        });
    });
};

/**
 * Fetches cafetoria data for keyfop
 * @param id of keyfop
 * @param pin of keyfop
 */
export const fetchDataForUser = async (id: string, pin: string): Promise<Cafetoria> => {
    if (id === '' && pin === '') {
        return await JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'cafetoria', 'list.json'), 'utf-8'));
    } else {
        return new Promise((resolve, reject) => {
            fetchData(id, pin).then((raw: any) => {
                const data = parse(raw);
                const menus = extractData(data, false);
                resolve(menus);
            }).catch(reject);
        });
    }
};

/**
 * Downloads the non-personalized cafetoria menu
 */
export const download = (checkIfNew = true): Promise<Cafetoria | undefined> => {
    return new Promise((resolve, reject) => {
        fetchData(config.cafetoriaId, config.cafetoriaPin).then((raw: string) => {
            console.log('Fetched menus');
            const data = parse(raw);
            console.log('Parsed menus');
            if (isNew(data) || isDev || !checkIfNew) {
                const menus = extractData(data, true);
                console.log('Extracted menus');
                resolve(menus);
            }
            resolve(undefined);
        }).catch(() => {
            reject({
                error: 'Wrong Cafetoria credentials'
            });
        });
    });
}

if (module.parent === null) {
    download().catch((reason) => console.log(reason));
}
