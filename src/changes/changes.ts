import express from 'express';
import bodyParser, { json } from 'body-parser';
import fs from 'fs';
import path from 'path';
import {weekdayToInt} from '../replacementplan/utils';
import {getTags} from '../tags/users';
import changesForUserID from './changesForUserID';

const changesRouter = express.Router();
changesRouter.use(bodyParser.json());

changesRouter.get('/:id', (req, res) => {
    const tags = getTags(req.params.id);
    if (tags.grade === undefined) {
        res.json({error: 'Tags not set jet'});
        return;
    }
    const weekdays = []
    weekdays.push(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'today', tags.grade + '.json')).toString()).for.weekday);
    weekdays.push(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', 'tomorrow', tags.grade + '.json')).toString()).for.weekday);
    const injectedUnitplan = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'unitplan', tags.grade + '.json')).toString());
    const changes = injectedUnitplan.data.filter((day: any) => day.replacementplan.for.date.length > 0).map((day: any) => {
        return {
            weekday: day.weekday,
            changes: changesForUserID(
                {
                    id: req.params.id,
                    tags: tags
                },
                injectedUnitplan,
                weekdayToInt(day.weekday)
            )
        }
    });
    res.json(changes);
});

export default changesRouter;