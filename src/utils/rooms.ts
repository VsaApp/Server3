export const getRoomID = (name: string): string => {
    if (name === undefined) return '';
    name = name.trim().toUpperCase().replace(' ', '');
    if (/^([ABCDEF])$/m.test(name)) {
        return name;
    }
    if (rooms[name] === undefined) {
        if (name.length > 3) {
            console.log(`Unknown room ${name}`);
        }
        return name.substr(0, 3);
    }
    return rooms[name];
};
export const roomsDate: string = '2019-11-11T17:48:38.290Z';
export const rooms: any = {
    KLH: 'klH',
    KLSPH: 'klH',
    GRSPH: 'grH',
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
    R223: '223',
    OASE: 'oas'
};