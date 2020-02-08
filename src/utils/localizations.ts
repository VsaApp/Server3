import path from 'path';
import fs from 'fs';

const localizations = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'localizations.json')).toString());

const getLocalization = (key: string) => {
    if (!localizations[key]) {
        throw `The key ${key}' does not exists in the localizations`;
    }
    return localizations[key];
}

export default getLocalization;