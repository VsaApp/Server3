export const getRoomID = (name: string): string => {
    if (name === undefined) return '';
    name = name.trim().toUpperCase();
    if (/^([ABCDEF])$/m.test(name)) {
        return name;
    }
    if (rooms[name] === undefined) {
        if (name !== '') {
            console.log(`Unknown room ${name}`);
        }
        return name;
    }
    return rooms[name];
};
export const roomsDate: string = '2019-11-11T17:48:38.290Z';
export const rooms: any = {
    KLH: 'klH',
    'KL SPH': 'klH',
    'GR SPH': 'grH',
    GRH: 'grH',
    SB: 'schH',
    PC1: 'PC1',
    PC2: 'PC2',
    KU1: 'Ku1',
    KU2: 'Ku2',
    AULA: 'Aul',
    AUL: 'Aul',
    SLZ: 'SLZ',
    WR: 'WerkR',
    TOI: 'Toi',
    'PH 1': 'Ph1',
    'PH 2': 'Ph2',
    112: '112',
    113: '113',
    114: '114',
    'RAUM 114': '114',
    122: '122',
    124: '124',
    127: '127',
    123: '123',
    132: '132',
    133: '133',
    134: '134',
    137: '137',
    142: '142',
    143: '143',
    144: '144',
    147: '147',
    221: '221',
    222: '222',
    'R223': 'PC1',
    223: 'PC1',
    322: '322',
    323: '323',
    501: '501',
    506: '506',
    'R. 506': '506',
    511: '511',
    513: '513',
    514: '514',
    515: '515',
    'RAUM 515': '515',
    516: '516',
    517: '517',
    521: '521',
    522: '522',
    523: '523',
    524: '524',
    525: '525',
    526: '526',
    527: '527',
    528: 'PC2',
    532: '532',
    533: '533',
    537: '537',
    538: '538'
};