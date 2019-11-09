import express from 'express';
import { download, fetchDataForUser } from './cafetoria_download';
import { Cafetoria } from '../utils/interfaces';

export const cafetoriaRouter = express.Router();
let data: Cafetoria | undefined;

cafetoriaRouter.get('/login/:id/:pin', async (req, res) => {
    if (req.params.id === 'null' || req.params.pin === 'null' || req.params.id === undefined || req.params.pin === undefined) {
        req.params.id = '';
        req.params.pin = '';
    }
    try {
        res.json(await fetchDataForUser(req.params.id, req.params.pin));
    } catch (e) {
        res.json(e);
    }
});

cafetoriaRouter.get('/list', (req, res) => {
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