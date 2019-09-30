import fs from 'fs';
import path from 'path';
import config from'../config';

const request = require('request');

export const informViktoriaApp = async () => {

    const data = {
        today: parseDay('today'),
        other: parseDay('tomorrow')
    };

    var options = {                 
        method: 'POST',             
        uri: 'http://viktoriaapp.viktoriaschule.net:3231/sp-update',    
        json: data,           
        headers: {               
          'Authorization': 'Basic ' + Buffer.from(`${config.viktoriaAppUsername}:${config.viktoriaAppPassword}`).toString('base64')                  
        }
      };

    request(options, function (error: any, response: any, body: any) {
            if (!error && response.statusCode == 200) {
                console.log('Successfully informed ViktoriaApp!');
            }
            else if (error) console.error('Failed to inform ViktoriaApp:', error);
        }
    );
}

const parseDay = (for_day: string) => {
    const data: any = {
        forDate: '',
        forDay: '',
        fromDate: '',
        fromTime: '',
        schoolClassesUsed: [],
        weekType: '',
        substitutionPlanEntries: {}
    };

    const files = fs.readdirSync(path.resolve(process.cwd(), 'out', 'replacementplan', for_day));
    files.map((file: string) => {
        const day = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out', 'replacementplan', for_day, file)).toString());
        data.forDate = day.for.date;
        data.forDay = day.for.weekday;
        data.weekType = day.for.weektype
        data.fromDate = day.updated.date;
        data.fromTime = day.updated.time;
        if (day.data.length > 0 || day.unparsed.length > 0) data.schoolClassesUsed.push(day.participant);
        data.substitutionPlanEntries[day.participant] = day.data;
        
    });
    return data;
}