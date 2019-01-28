
const changesForUserID = (_device: any, unitplan: any, weekday: number): any[] => {
    const examTags: any = {};
        Object.keys(_device.tags).filter(key => key.startsWith('exams')).forEach(key => {
            examTags[key.split('-')[2]] = _device.tags[key];
        });
    const unitplanTags: any = {};
    Object.keys(_device.tags).filter(key => key.startsWith('unitPlan')).forEach(key => {
        unitplanTags[key.split(_device.tags.grade + '-')[1]] = parseInt(_device.tags[key]);
    });
    const device = {
        id: _device.id,
        grade: _device.tags.grade,
        isDev: _device.tags.dev,
        exams: examTags,
        unitplan: unitplanTags
    };

    const day = unitplan.data[weekday];
    const changes: any[] = [];
    Object.keys(day.lessons).forEach((unit: string) => {
        let subjects = day.lessons[unit];
        subjects.forEach((subject: any) => {
            let identifier = (subject.block !== '' ? subject.block : weekday + '-' + unit);
            if (subject.changes !== undefined) {
                subject.changes.forEach((change: any) => {
                    let isMy = -1;
                    if (Object.keys(device.unitplan).indexOf(identifier) >= 0) {
                        if (device.unitplan[identifier] === subjects.indexOf(subject)) {
                            if (change.exam && !change.rewriteExam && !device.exams[change.change.subject]) {
                                isMy = 0;
                            }
                            else if (!change.sure) isMy = -1;
                            else isMy = 1;
                        }
                        else isMy = 0;
                    }

                    changes.push({
                        unit: change.unit,
                        subject: change.subject,
                        course: change.course,
                        room: change.room,
                        teacher: change.participant,
                        change: change.change,
                        isMy: isMy,
                        identifier: identifier,
                        nSubject: {
                            block: subject.block,
                            participant: subject.participant,
                            subject: subject.subject,
                            room: subject.room,
                            course: subject.course
                        }
                    });
                });
            }
        });
    });
    return changes;
};

export default changesForUserID;