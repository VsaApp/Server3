const rooms: any = {
    KLH: 'Kleine Halle',
    GRH: 'Große Halle',
    SB: 'Schwimmbad',
    PC1: 'PC 1',
    PC2: 'PC 2',
    KU1: 'Kunst 1',
    KU2: 'Kunst 2',
    AULA: 'Aula',
    AUL: 'Aula'
};

export const getRoom = (name: string) => {
    name = name.trim().toUpperCase();
    if (/^\d+$/.test(name) || /^([ABCD])$/m.test(name)) {
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