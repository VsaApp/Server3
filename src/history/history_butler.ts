import fs from 'fs';
import path from 'path';
import express from 'express';
import getAuth, { isDeveloper } from '../utils/auth';

const historyRouter = express.Router();

/**
 * Returns an html string for the elements in the given directory
 * @param dirPath path to directory
 */
const getDir = (dirPath: string, relPath: string): string => {
    const elements = fs.readdirSync(dirPath).map((i) => {
        const isDir = fs.lstatSync(path.join(dirPath, i)).isDirectory();
        return `<a href="/history${relPath}/${i}">${i}${isDir ? '/' : ''}</a><br />`;
    });
    return `<html>${elements.join('')}</html>`;
}

/**
 * Handles a request for the history
 * @param folderUrl the request url for this folder
 * @param folderName the real folder name
 * @param url the request url
 * @param res the response object
 */
const handleHistoryRequest = (url: string, res: any): any => {
    let dirPath = path.resolve(process.cwd(), 'history');
    dirPath = path.join(dirPath, url.substr(1));
    const isDir = fs.lstatSync(dirPath).isDirectory();
    if (!fs.existsSync(dirPath)) return res.status(404).send('Page not found!');
    if (isDir) {
        return res.send(getDir(dirPath, url));
    }
    return res.sendFile(dirPath);
}

historyRouter.get(/\//, (req, res) => {
    const isDev = isDeveloper(getAuth(req).username);
    if (!isDev) {
        res.status(401)
        res.json({error: 'unauthorized'});
        return;
    }
    handleHistoryRequest(req.url, res);
});

export default historyRouter;