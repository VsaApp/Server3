import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import config from'../utils/config';
import {getAuth, isDeveloper} from '../utils/auth';

const nodemailer = require('nodemailer');

const bugsRouter = express.Router();
bugsRouter.use(bodyParser.json());

bugsRouter.get('/', async (req, res) => {
    const isDev = isDeveloper(getAuth(req).username);
    if (!isDev) {
        res.status(401)
        return res.json({error: 'unauthorized'});
    }
    const filePath = path.resolve(process.cwd(), 'bugs.json');
    if (!fs.existsSync(filePath)) {
        res.json({info: 'Currently no bugs!'});
        return;
    }
    return res.json(JSON.parse((await fs.readFileSync(filePath)).toString()));
});

bugsRouter.get('/html/', async (req, res) => {
    const filePath = path.resolve(process.cwd(), 'bugs.json');
    if (!fs.existsSync(filePath)) {
        res.send('<h1>Bugs</h1><p>Currently no bugs!</p>');
        return;
    }
    const versions = JSON.parse((await fs.readFileSync(filePath)).toString());
    let htmlString = '<h1>Bugs</h1><h2>App versions:</h2>';
    Object.keys(versions).forEach((version: string) => {
        htmlString += `<h3>${version}</h3>`;
        versions[version].forEach((bug: any) => {
            htmlString += getHtml(bug);
        });
    });
    res.send(htmlString);
});

const getHtml = (bug: any): string => {
    return `<p><b>Thrown ${bug.count} times</b><br>Users: [${bug.ids.map((id: string) => `<a href="${config.apiEndpoint}/tags/${id}" target="_blank">${id}</a>`)}]<br>${bug.msg.split('\n').join('<br>')}</p>`;
};

bugsRouter.post('/report/', async (req, res) => {
    const filePath = path.resolve(process.cwd(), 'bugs.json');
    const version = req.body.version || 'UNDEFINED';
    const title = req.body.title;
    const error = req.body.error;
    const id = req.body.id;

    if (!fs.existsSync(filePath)) await fs.writeFileSync(filePath, '{}');

    const newText = `${title}\n${error}`;
    const currentBugs = JSON.parse((await fs.readFileSync(filePath)).toString());
    const newBug = {
        count: 1,
        ids: [id],
        msg: newText
    };

    let isNew = true;

    if (currentBugs[version] === undefined) {
        currentBugs[version] = [newBug];
    }
    else if (currentBugs[version].map((bug: any) => bug.msg).includes(newText)) {
        currentBugs[version][currentBugs[version].map((bug: any) => bug.msg).indexOf(newText)].count++;
        currentBugs[version][currentBugs[version].map((bug: any) => bug.msg).indexOf(newText)].ids.push(id);
        isNew = false;
    }
    else currentBugs[version].push(newBug);
    fs.writeFileSync(filePath, JSON.stringify(currentBugs, null, 2));

    res.json({'status': 'reported'});

    if (!isNew) return;

    console.log("Send E-Mail");

    // Send E-Mail to inform about the new bug...
    // Send request mail to vsa@2bad2c0.de
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.2bad2c0.de',
        port: 587,
        secure: false,
        auth: {
            user: config.emailUser,
            pass: config.emailKey
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: `"VsaApp" <${config.emailUser}>`, // sender address
        to: config.emailUser, // list of receivers
        subject: 'Ein Fehler ist aufgetreten!', // Subject line
        text: `Es ist ein neuer Fehler aufgetreten! \n\n App Version: ${version}\n\nFehlermeldung:\n${newText}`, // plain text body
        html: `<p>Es ist ein neuer Fehler aufgetreten!</p><p><a href="${config.apiEndpoint}/bugs/html" target="_blank">Anschauen</a></p>` + getHtml(newBug)
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error: any, info: any) => {});
});

export default bugsRouter;