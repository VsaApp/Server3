import fs from 'fs';
import path from 'path';
import {getRoom} from '../rooms';
import {getSubject} from "../subjects";
const nodemailer = require('nodemailer');
import config from'../config';

export const extractData = async (raw: any) => {
    const grades = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c', '9a', '9b', '9c', 'EF', 'Q1', 'Q2'];
    return await grades.map(grade => {
        const data: any = [];
        const unparsed: any = [];

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

        // Parse changes
        try {
            let isCurrentGrade = false;
            raw.querySelectorAll('tr').forEach((row: any, i: number) => {
                // Check if it is the current grade
                if ((row.classNames.includes('even') || row.classNames.includes('odd')) && row.childNodes[0].classNames.includes('inline_header')) {
                    try {
                        if (row.childNodes[0].childNodes[0].rawText.startsWith(grade)) {
                            isCurrentGrade = true;
                        }
                        else {
                            isCurrentGrade = false;
                        }
                        return;
                    } catch (e) {
                        console.error("Cannot read grade: ", grade, date, row, i, e);
                    }
                }
                else if ((row.classNames.includes('even') || row.classNames.includes('odd')) && isCurrentGrade) {
                    try {
                        
                        let unit = parseInt(row.childNodes[0].childNodes[0].rawText.trim()) - 1;
                        if (unit > 4) unit++;
                        
                        const color = row.childNodes[0].rawAttrs.includes('background-color') ? row.childNodes[0].rawAttrs.split('#')[1].split('"')[0].trim() : undefined;
                        
                        let info = row.childNodes[4].childNodes[0].rawText.replace('&nbsp;', '').trim();
                        let normalSubject;
                        let normalCourse;
                        let normalRoom;
                        let normalParticipant;
                        let newSubject;
                        let newCourse;
                        let newRoom;
                        let newParticipant;

                        let participantCell = row.childNodes[1];
                        if (participantCell.childNodes[0].tagName === 'span') participantCell = participantCell.childNodes[0];
                        // No changed teacher
                        if (participantCell.childNodes.length === 1) {
                            if (participantCell.querySelectorAll('s').length === 1) {
                                normalParticipant = participantCell.childNodes[0].childNodes[0].rawText.trim();
                                newParticipant = '';
                                info = ('Freistunde' + ' ' + info).trim();
                            }
                            else {
                                normalParticipant = participantCell.childNodes[0].rawText.trim();
                                newParticipant = normalParticipant;
                            }
                        }
                        // Teacher changed
                        else if (participantCell.childNodes.length === 2) {
                            normalParticipant = participantCell.childNodes[0].childNodes[0].rawText.trim();
                            newParticipant = participantCell.childNodes[1].rawText.replace('→', '').trim();
                        }

                        let subjectCell = row.childNodes[2];
                        if (subjectCell.childNodes[0].tagName === 'span') subjectCell = subjectCell.childNodes[0];
                        // No changed subject
                        if (subjectCell.childNodes.length === 1) {
                            if (subjectCell.querySelectorAll('s').length === 1) {
                                normalSubject = subjectCell.childNodes[0].childNodes[0].rawText.trim().split(' ')[0];
                                normalCourse = subjectCell.childNodes[0].childNodes[0].rawText.trim().split(' ')[1];
                                newSubject = '';
                                newCourse = '';
                            }
                            else {
                                normalSubject = subjectCell.childNodes[0].rawText.trim().split(' ')[0];
                                normalCourse = subjectCell.childNodes[0].rawText.trim().split(' ')[1];
                                newCourse = normalCourse;
                                newSubject = normalSubject;
                            }
                        }
                        // Subject changed
                        else if (subjectCell.childNodes.length === 2) {
                            normalSubject = subjectCell.childNodes[0].childNodes[0].rawText.trim().split(' ')[0];
                            normalCourse = subjectCell.childNodes[0].childNodes[0].rawText.trim().split(' ')[1];
                            newSubject = subjectCell.childNodes[1].rawText.replace('→', '').trim().split(' ')[0];
                            newCourse = subjectCell.childNodes[1].rawText.replace('→', '').trim().split(' ')[1];
                        }

                        let roomCell = row.childNodes[3];
                        if (roomCell.childNodes[0].tagName === 'span') roomCell = roomCell.childNodes[0];
                        // No changed room
                        if (roomCell.childNodes.length === 1) {
                            if (roomCell.querySelectorAll('s').length === 1) {
                                normalRoom = roomCell.childNodes[0].childNodes[0].rawText.trim();
                                newRoom = '';
                            }
                            else {
                                normalRoom = roomCell.childNodes[0].rawText.trim();
                                newRoom = normalRoom;

                                if (normalRoom === '---') {
                                    normalRoom = '';
                                    newRoom = '';
                                }
                            }
                        }
                        // room changed
                        else if (roomCell.childNodes.length === 2) {
                            normalRoom = roomCell.childNodes[0].childNodes[0].rawText.trim();
                            newRoom = roomCell.childNodes[1].rawText.replace('→', '').trim();
                        }

                        data.push({
                            unit: unit,
                            subject: normalSubject,
                            course: normalCourse || '',
                            room: normalRoom,
                            participant: normalParticipant,
                            change: {
                                subject: newSubject,
                                course: newCourse || '',
                                teacher: newParticipant,
                                room: newRoom,
                                info: info
                            }
                        });
                        
                    } catch (e) {
                        console.error('Cannot parse element:', i, grade, date, row, e);

                        unparsed.push(row);
                        sendMail(grade, date, update, i, e)
                    }
                }
            });
        } catch (e) {
            console.error('Cannot find \'tr\' selectors', e.toString());
        }
        for (let l = 0; l < data.length; l++) {
            data[l].subject = data[l].subject.replace(/PJ.+/g, 'PJ').replace(/[0-9]/g, '');
            data[l].change.subject = data[l].change.subject.replace(/PJ.+/g, 'PJ').replace(/[0-9]/g, '');
            data[l].subject = getSubject(data[l].subject);
            data[l].course = data[l].course.trim().toUpperCase();
            data[l].room = getRoom(data[l].room);
            data[l].participant = data[l].participant.trim().toUpperCase();
            data[l].change.subject = getSubject(data[l].change.subject);
            data[l].change.room = getRoom(data[l].change.room);
            data[l].change.teacher = data[l].change.teacher.trim().toUpperCase();
            data[l].change.info = data[l].change.info.trim();
        }

        return {
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
            data: data,
            unparsed: unparsed
        }
    });
};

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