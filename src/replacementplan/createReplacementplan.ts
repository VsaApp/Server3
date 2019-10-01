import fs from 'fs';
import path from 'path';
import {getRoom} from '../rooms';
import {getSubject} from "../subjects";
const nodemailer = require('nodemailer');
import config from'../config';

export const extractData = async (raw: any, isDev: boolean) => {

    // Get dates
    let weektype = '';
    let date = new Date(2000, 0);
    let weekday = '?';
    try {
        const rawDateInfo = raw.querySelectorAll('div')[0].childNodes[0].rawText
        weektype = rawDateInfo.slice(-1);
        const dateStr = rawDateInfo.split(' ')[0].split('.');
        date = new Date(`${dateStr[2]}-${dateStr[1]}-${dateStr[0]}`);
        weekday = rawDateInfo.split(' ')[1].replace(',', '');
    } catch (e) {
        console.error('Cannont get the \'for\' date of the replacement plan', e.toString());
    }
    let update = new Date().getUTCDate().toString() + '.' + (new Date().getUTCMonth() + 1).toString() + '.' + new Date().getUTCFullYear().toString();
    let updateTime = new Date().getUTCMinutes().toString() + ':' + new Date().getUTCHours().toString();
    try {
        update = raw.querySelectorAll('html')[0].childNodes[2].rawText.trim().split(' ')[1];
        updateTime = raw.querySelectorAll('html')[0].childNodes[2].rawText.trim().split(' ')[2];
    } catch (e) {
        console.error('Cannont get the \'update\' date of the replacement plan', e.toString());
    }
    
    // Create grades objects
    const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2']
    const data: any = {};
    grades.forEach((grade: string) => {
        data[grade] = {
            participant: grade,
            for: {
                date: (date.getUTCDate() + 1) + '.' + (date.getUTCMonth() + 1) + '.' + date.getUTCFullYear(),
                weekday: weekday,
                weektype: weektype
            },
            updated: {
                date: update,
                time: updateTime
            },
            data: [],
            unparsed: []
        }
    });
    
    // Parse changes
    try {
        raw.querySelectorAll('tr').forEach((row: any, i: number) => {
            // Check if it's a data line of the current grade
            if ((row.classNames.includes('even') || row.classNames.includes('odd'))) {
                try {
                    let rawGrades = row.childNodes[0].childNodes[0].rawText.trim().split(', ');
                    // Parse the line for each grade
                    rawGrades.forEach((grade: string) => {
                        grade = grade.trim();
                        if (!grades.includes(grade)) return;
                        try {
                            const rawUnit = row.childNodes[1].childNodes[0].rawText.trim();
                            rawUnit.split('-').forEach((cUnit: any) => {
                                let unit = parseInt(cUnit.trim()) - 1;
                                if (unit > 4) unit++;
                                                        
                                let info = row.childNodes[6].childNodes[0].rawText.replace('&nbsp;', '').trim();
                                let type = row.childNodes[3].childNodes[0].rawText.trim();
                                let normalSubject = '';
                                let normalCourse = '';
                                let normalRoom = '';
                                let normalParticipant = '';
                                let newSubject = '';
                                let newCourse = '';
                                let newRoom = '';
                                let newParticipant = '';

                                let participantCell = row.childNodes[4];
                                if (participantCell.childNodes[0].tagName === 'span') participantCell = participantCell.childNodes[0];
                                // No changed teacher
                                if (participantCell.childNodes.length === 1) {
                                    if (participantCell.querySelectorAll('s').length === 1) {
                                        normalParticipant = optimizeString(participantCell.childNodes[0].childNodes[0].rawText);
                                        newParticipant = '';
                                    }
                                    else {
                                        normalParticipant = optimizeString(participantCell.childNodes[0].rawText);
                                        newParticipant = optimizeString(normalParticipant);
                                    }
                                }
                                // Teacher changed
                                else if (participantCell.childNodes.length === 2) {
                                    normalParticipant = optimizeString(participantCell.childNodes[0].childNodes[0].rawText);
                                    newParticipant = optimizeString(participantCell.childNodes[1].rawText);
                                }

                                let subjectCell = row.childNodes[2];
                                if (subjectCell.childNodes[0].tagName === 'span') subjectCell = subjectCell.childNodes[0];
                                // No changed subject
                                if (subjectCell.childNodes.length === 1) {
                                    if (subjectCell.querySelectorAll('s').length === 1) {
                                        normalSubject = optimizeString(subjectCell.childNodes[0].childNodes[0].rawText).split(' ')[0];
                                        normalCourse = optimizeString(subjectCell.childNodes[0].childNodes[0].rawText).split(' ')[1];
                                        newSubject = '';
                                        newCourse = '';
                                        if (type === 'Trotz Absenz') type = 'Freistunde';
                                    }
                                    else {
                                        normalSubject = optimizeString(subjectCell.childNodes[0].rawText).split(' ')[0];
                                        normalCourse = optimizeString(subjectCell.childNodes[0].rawText).split(' ')[1];
                                        newCourse = normalCourse;
                                        newSubject = normalSubject;
                                    }
                                }
                                // Subject changed
                                else if (subjectCell.childNodes.length === 2) {
                                    normalSubject = optimizeString(subjectCell.childNodes[0].childNodes[0].rawText).split(' ')[0];
                                    normalCourse = optimizeString(subjectCell.childNodes[0].childNodes[0].rawText).split(' ')[1];
                                    newSubject = optimizeString(subjectCell.childNodes[1].rawText.replace('→', '')).split(' ')[0];
                                    newCourse = optimizeString(subjectCell.childNodes[1].rawText.replace('→', '')).split(' ')[1];
                                }

                                let roomCell = row.childNodes[5];
                                if (roomCell.childNodes[0].tagName === 'span') roomCell = roomCell.childNodes[0];
                                // No changed room
                                if (roomCell.childNodes.length === 1) {
                                    if (roomCell.querySelectorAll('s').length === 1) {
                                        normalRoom = optimizeString(roomCell.childNodes[0].childNodes[0].rawText);
                                        newRoom = '';
                                    }
                                    else {
                                        normalRoom = optimizeString(roomCell.childNodes[0].rawText);
                                        newRoom = normalRoom;

                                        if (normalRoom === '---') {
                                            normalRoom = '';
                                            newRoom = '';
                                        }
                                    }
                                }
                                // room changed
                                else if (roomCell.childNodes.length === 2) {
                                    normalRoom = optimizeString(roomCell.childNodes[0].childNodes[0].rawText);
                                    newRoom = optimizeString(roomCell.childNodes[1].rawText.replace('→', ''));
                                }

                                type = type.replace('Entfall', 'Freistunde');
                                type = type.replace('Betreuung', 'Vertretung');

                                data[grade].data.push({
                                    unit: unit,
                                    subject: getFullSubject(normalSubject),
                                    course: (normalCourse || '').trim().toUpperCase(),
                                    room: getRoom(normalRoom),
                                    participant: normalParticipant.trim().toUpperCase(),
                                    type: type,
                                    change: {
                                        subject: getFullSubject(newSubject),
                                        course: (newCourse || '').trim().toUpperCase(),
                                        teacher: newParticipant.trim().toUpperCase(),
                                        room: getRoom(newRoom),
                                        info: (type + ' ' + info).trim()
                                    }
                                });
                            });
                            
                        } catch (e) {
                            console.error('Cannot parse element:', i, date, row, e);
                            
                            const rawLine = row.childNodes.map((element: any) => element.rawText.replace('&nbsp;', ''));
                            data[grade].unparsed.push(rawLine);
                            if (!isDev) sendMail(grade, date, update, i, e);
                        }
                    });
                } catch (e) {
                    console.error('Cannot parse grade:', i, data, row, e);
                    const rawLine = row.childNodes.map((element: any) => element.rawText.replace('&nbsp;', ''));
                    Object.keys(data).forEach((grade: string) => {
                        data[grade].unparsed.push(rawLine);
                    });
                    if (!isDev) sendMail('???', date, update, i, e);
                }
            }
        });
    } catch (e) {
        console.error('Cannot find \'tr\' selectors', e.toString());
    }

    return Object.values(data);
};

const optimizeString = (text: string) => {
    return text.replace( /\s\s+/g, ' ' ).replace('→', '').replace('&nbsp;', '').replace('---', '');
}

const getFullSubject = (subject: any) => {
    let su = subject.replace(/PJ.+/g, 'PJ').replace(/[0-9]/g, '');
    return getSubject(su);
}

const sendMail = (grade: string, date: Date, update: string, line: number, error: string) => {
    console.log("Send E-Mail with the failed parsing line");

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
        subject: 'Eine Vertretung konnte nicht geparsed werden!', // Subject line
        text: `Im Vertretungsplan für ${date.toString()} (Stand: ${update}) ist für die Klasse ${grade} in der Zeile ${line} ein Feler aufgetreten! \n\n Fehlermeldung:\n${error}`, // plain text body
        html: `<p>Im Vertretungsplan für ${date.toString()} (Stand: ${update}) ist für die Klasse ${grade} in der Zeile ${line} ein Feler aufgetreten!</p><p> Fehlermeldung:\n${error}</p>`
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error: any, info: any) => {});

}