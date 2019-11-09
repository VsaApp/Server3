export const subjects: any = {
    BI: 'Bio',
    CH: 'Chemie',
    DP: 'PoWi',
    DFÖ: 'Deutsch Förder',
    DF: 'Deutsch Förder',
    DB: 'NW',
    D: 'Deutsch',
    ER: 'E. Reli',
    EK: 'Erdkunde',
    EF: 'Englisch Förder',
    E: 'Englisch',
    FS: 'Schreibwerkstatt',
    FÖ: 'Förder',
    FF: 'Französisch Förder',
    F: 'Französisch',
    GE: 'Geschichte',
    IF: 'Info',
    KW: 'Kunst',
    KU: 'Kunst',
    KR: 'K. Reli',
    LF: 'Latein Förder',
    L: 'Latein',
    MU: 'Musik',
    MINT: 'Mint',
    MI: 'Mint',
    MF: 'Mathe Förder',
    MC: 'M. Chor',
    M: 'Mathe',
    NWP: 'NW',
    NWB: 'NW',
    NW: 'NW',
    ORI: 'Ori',
    OR: 'Ori',
    POW: 'PoWi',
    POWI: 'PoWi',
    PO: 'PoWi',
    PJD: 'Projektkurs Deutsch',
    PJ: 'Projektkurs',
    PL: 'Philosophie',
    PK: 'Politik',
    PH: 'Physik',
    SW: 'SoWi',
    SP: 'Sport',
    SN: 'SoWi',
    SG: 'Streichergruppe',
    S: 'Spanisch',
    UC: 'U. Chor',
    VM: 'Vertiefung Mathe',
    VE: 'Vertiefung Englisch',
    VD: 'Vertiefung Deutsch'
};

export const getSubject = (name: string): string => {
    name = name.trim().toUpperCase();
    if (subjects[name] === undefined) {
        if (name !== '') {
            console.log(`Unknown subject ${name}`);
        }
        return name;
    }
    return subjects[name];
};
