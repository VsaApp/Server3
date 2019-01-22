import config from '../config';
import got from 'got';
import { weekdayToInt, intToWeekday } from './utils';
import {updateApp} from '../update_app';

export const getDevices = async () => {
    let url = 'https://onesignal.com/api/v1/players?app_id=' + config.appId;
    const response = await got.get(
        url,
        {
            headers: {
                'Authorization': 'Basic ' + config.appAuthKey
            }
        });
    if (response.statusCode === 200) {
        return await response.body;
    } else {
        throw response.body;
    }
};


export const sendNotifications = async (isDev: Boolean, today: Boolean, data: any, replacementplan1: any, unitplans: any) => {
    try {
        let devices = JSON.parse(await getDevices());
        devices = devices.players.filter((device: any) => {
            return device.tags.grade !== undefined;
        }).map((device: any) => {
            const id = device.id;
            const grade = device.tags.grade;
            const isDev = device.tags.dev === 'true';
            const exams: any = {};
            Object.keys(device.tags).filter(key => key.startsWith('exams')).forEach(key => {
                exams[key.split('-')[2]] = device.tags[key] === 'true';
            });
            const unitplan: any = {};
            Object.keys(device.tags).filter(key => key.startsWith('unitPlan')).forEach(key => {
                unitplan[key.split(grade + '-')[1]] = parseInt(device.tags[key]);
            });
            return {
                id,
                grade,
                isDev,
                exams,
                unitplan
            }
        });
        if (isDev) {
            devices = devices.filter((device: any) => device.isDev);
        }
        console.log('Sending notifications to ' + devices.length + ' devices');
        devices.forEach(async (device: any) => {
            try {
                const unitplan = unitplans[device.grade + '-' + (today ? 'today' : 'tomorrow')];
                const weekday = weekdayToInt(replacementplan1[0].for.weekday);
                const day = unitplan.data[weekday];
                let text = '';
                Object.keys(day.lessons).forEach((unit: string) => {
                    let subjects = day.lessons[unit];
                    subjects.forEach((subject: any) => {
                        let identifier = (subject.block !== '' ? subject.block : weekday + '-' + unit);
                        if (Object.keys(device.unitplan).indexOf(identifier) > 0) {
                            if (device.unitplan[identifier] === subjects.indexOf(subject)) {
                                if (subject.changes !== undefined) {
                                    subject.changes.forEach((change: any) => {
                                        if (change.exam && !change.rewriteExam && !device.exams[change.change.subject]) {
                                            return;
                                        }
                                        text +=
                                            (!change.sure ? '(' : '')
                                            + (change.unit + 1) + '. Stunde ' + subject.subject
                                            + (subject.participant !== '' ? ' ' + subject.participant : '') + ':'
                                            + (change.change.subject !== '' ? ' ' + change.change.subject : '')
                                            + (change.change.info !== '' ? ' ' + change.change.info : '')
                                            + (change.change.teacher !== '' ? ' ' + change.change.teacher : '')
                                            + (change.change.room !== '' ? ' ' + change.change.room : '')
                                            + (!change.sure ? ')' : '') + '\n';
                                    });
                                }
                            }
                        }
                    });
                });
                text = text.slice(0, -1);
                if (text.length === 0) {
                    text = 'Es gibt keine Änderungen';
                }
                const dataString = {
                        app_id: config.appId,
                        include_player_ids: [device.id],
                        android_group: weekday.toString(),
                        contents: {
                            de: text,
                            en: text
                        },
                        headings: {
                            de: intToWeekday(weekday),
                            en: intToWeekday(weekday)
                        },
                        data: {
                            type: 'replacementplan'
                        }
                    }
                ;
                let url = 'https://onesignal.com/api/v1/notifications';
                try {
                    const response = await got.post(
                        url,
                        {
                            headers: {
                                'Content-Type': 'application/json; charset=utf-8',
                                'Authorization': 'Basic ' + config.appAuthKey
                            },
                            body: JSON.stringify(dataString)
                        });
                    if (JSON.parse(response.body).errors !== undefined) {
                        if (JSON.parse(response.body).errors[0] === 'All included players are not subscribed') {
                            return;
                        }
                    }
                    console.log(response.body);
                } catch (response) {
                    console.log(response);
                }
            } catch (e) {
                console.error('Cannot send notification to device: ', device);
            }
        });
        const dateStr = data.querySelectorAll('div')[0].childNodes[0].rawText.substr(1).replace('-Klassen-Vertretungsplan für ', '').replace('Januar', 'January').replace('Februar', 'February').replace('März', 'March').replace('Mai', 'May').replace('Juni', 'June').replace('Juli', 'July').replace('Oktober', 'October').replace('Dezember', 'December');
        const weekday = dateStr.split(', ')[0];
        updateApp('All', {'type': 'replacementplan', 'action': 'update', 'day': (today ? 'today' : 'tomorrow'), 'weekday': weekday}, isDev);
    } catch (e) {
        console.error('Failed to send notifications', e);
    }
}
