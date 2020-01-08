import express from 'express';
import bodyParser from 'body-parser';
import { download, fetchDataForUser } from './cafetoria_download';
import { Cafetoria } from '../utils/interfaces';

export const cafetoriaRouter = express.Router();
cafetoriaRouter.use(bodyParser.json());

let data: Cafetoria | undefined;

cafetoriaRouter.post('/', async (req, res) => {
    if (req.body.id === 'null' || req.body.pin === 'null' || req.body.id === undefined || req.body.pin === undefined) {
        req.body.id = '';
        req.body.pin = '';
    }
    try {
        res.json(await fetchDataForUser(req.body.id, req.body.pin));
    } catch (e) {
        res.json(e);
    }
});

cafetoriaRouter.get('/', (req, res) => {
    return res.json(data);
});

export const updateCafetoriaMenus = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        download(data != undefined).then((_data) => {
            data = _data || data;
            resolve()
        }).catch((reason) => console.error(reason));
    });
};