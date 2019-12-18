import path from 'path';
import fs from 'fs';

const localizations = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'localizations.json')).toString());

export default localizations;