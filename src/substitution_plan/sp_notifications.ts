import { getUsers } from '../tags/users';
import { updateApp } from '../utils/update_app';
import { sendNotification } from '../utils/notification';
import { User, Device, SubstitutionPlan } from '../utils/interfaces';
import { isDeveloper } from '../utils/auth';
import { getSubstitutionsForUser } from './sp_filter';
import { getSubject } from '../utils/subjects';


export const sendNotifications = async (isDev: Boolean, day: number, substitutionplanDay: SubstitutionPlan) => {
    try {
        if (substitutionplanDay === undefined) throw 'Substitution plan is undefined'
        const weekday = new Date(substitutionplanDay.date).getDay() - 1;

        let users = getUsers().filter((user: User) => (!isDev || isDeveloper(user.username)) && user.grade !== undefined);
        console.log('Sending notifications to ' + users.length + ' users');
        const notifications = new Map<string, Device[]>();
        for (let user of users) {
            try {
                const substitutions = getSubstitutionsForUser(user, substitutionplanDay);
                for (let device of user.devices) {
                    try {
                        if (!device.notifications) return;
                        var text = substitutions.map((s) => {
                            const unsure = s.courseID === undefined && s.id === undefined;
                            let text = ''
                            if (unsure) text += '(';
                            text += `${s.unit + 1}. Stunde ${getSubject(s.original.subjectID)} ${s.original.teacherID.toLocaleUpperCase()}`.trim();
                            text += ': ';
                            if (s.type === 0) text += 'Änderung';
                            else if (s.type === 1) text += 'Freistunde';
                            else if (s.type === 2) text += 'Klausur';
                            if (unsure) text += ')';
                            
                            return text;
                        }).join('\n');
                        if (text.length === 0) text = 'Es gibt keine Änderungen für dich';
                        const title = getWeekday(weekday, device.language);
                        const notification = `${title}||${text}`;
                        if (!notifications.get(notification)) {
                            notifications.set(notification, []);
                        }
                        const devices = notifications.get(notification);
                        if (devices) {
                            devices.push(device);
                        }
                    }
                    catch (e) {
                        console.error(`Cannot send notification to ${user.username}'s device: ${device.firebaseId}:`, e);
                    }
                }
            } catch (e) {
                console.error('Cannot send notification to user: ', user.username, e);
            }
        }

        // Send all notifications
        console.log(`Send ${notifications.size} different notifications`)
        for (var notification of Array.from(notifications.keys())) {
            try {
                await sendNotification({
                    devices: notifications.get(notification) || [],
                    group: weekday.toString(),
                    text: notification.split('||')[1],
                    title: notification.split('||')[0],
                    data: {
                        type: 'substitution plan'
                    }
                });
            }
            catch (e) {
                console.error(`Cannot send notification:`, e);
            }
        }

        await updateApp('All', {
            'type': 'substitution plan',
            'action': 'update',
            'day': day.toString(),
            'weekday': weekday.toString()
        }, isDev);

    } catch (e) {
        console.error('Failed to send notifications', e);
    }
}

const getWeekday = (day: number, locals: string): string => {
    const de = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    const en = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return locals === 'de' ? de[day] : en[day];
}