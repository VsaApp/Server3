import got from 'got';
import config from '../config';
import {parse} from 'node-html-parser';

const fetchData = async () => {
    let path = `https://viktoriaschule-aachen.de/index.php?menuid=3`;
    return (await got(path, {auth: config.username + ':' + config.rpPassword})).body;
};

const parseData = async (raw: string) => {
    return await parse(raw);
};

export const getUrl = async () => {
    const data = await parseData(await fetchData());
    const url: any = data.querySelectorAll('.downloadlink').filter((i: any) => i.rawAttrs.includes('title="Terminplanung für'))[0];
    return 'https://viktoriaschule-aachen.de' + url.rawAttrs.split('href="')[1].split('"')[0].replace('&amp;', '&');
}