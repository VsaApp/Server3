import fs from 'fs';
import path from 'path';

const file = path.resolve(process.cwd(), 'messageboard.json');

let data = {};

function loadData() {
    if (process.env.MODE !== 'test') {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
        } else {
            data = JSON.parse(fs.readFileSync(file).toString());
        }
    }
}

function saveData() {
    if (process.env.MODE !== 'test') {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }
}

const db = {
    set: (key: string, value: any) => {
        loadData();
        (<any>data)[key] = value;
        saveData();
    },
    get: (key: string) => {
        loadData();
        return (<any>data)[key];
    },
    delete: (key: string) => {
        loadData();
        delete (<any>data)[key];
        saveData();
    }
};

export default db;