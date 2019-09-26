import got from 'got';
import config from './config';
import {parse} from 'node-html-parser';

const fetchData = async (menuid: number) => {
    let path = `https://viktoriaschule-aachen.de/index.php?menuid=${menuid}`;
    return (await got(path, {auth: config.username + ':' + config.password})).body;
};

const parseData = async (raw: string) => {
    return await parse(raw);
};

export const getUrl = async (text: string, menuid: number) => {
    const data = await parseData(await fetchData(menuid));
    const url: any = data.querySelectorAll('.downloadlink').filter((i: any) => i.childNodes[0].rawText.includes(text))[0];
    return 'https://viktoriaschule-aachen.de' + url.rawAttrs.split('href="')[1].split('"')[0].replace('&amp;', '&');
}