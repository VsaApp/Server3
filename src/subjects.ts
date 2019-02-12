const subjects: any = {
    CH: 'Chemie',
    PH: 'Physik',
    MI: 'Mint',
    MINT: 'Mint',
    NW: 'NW',
    DB: 'NW',
    NWP: 'NW',
    NWB: 'NW',
    DP: 'PoWi',
    PO: 'PoWi',
    POWI: 'PoWi',
    IF: 'Info',
    S: 'Spanisch',
    MU: 'Musik',
    SP: 'Sport',
    F: 'Französisch',
    L: 'Latein',
    ER: 'E. Reli',
    KR: 'K. Reli',
    D: 'Deutsch',
    E: 'Englisch',
    M: 'Mathe',
    PK: 'Politik',
    BI: 'Bio',
    UC: 'U. Chor',
    MC: 'M. Chor',
    EK: 'Erdkunde',
    KU: 'Kunst',
    KW: 'Kunst',
    SW: 'SoWi',
    PL: 'Philosophie',
    GE: 'Geschichte',
    VM: 'Vertiefung Mathe',
    VD: 'Vertiefung Deutsch',
    VE: 'Vertiefung Englisch',
    FF: 'Französisch Förder',
    LF: 'Latein Förder',
    EF: 'Englisch Förder',
    MF: 'Mathe Förder',
    DF: 'Deutsch Förder',
    DFÖ: 'Deutsch Förder',
    FÖ: 'Förder',
    PJ: 'Projektkurs',
    PJD: 'Projektkurs Deutsch',
    SG: 'Streichergruppe',
    OR: 'Ori',
    ORI: 'Ori'
};

export const getSubject = (name: string) => {
    name = name.trim().toUpperCase();
    if (subjects[name] === undefined) {
        if (name !== '') {
            console.log(`Unknown subject ${name}`);
        }
        return name;
    }
    return subjects[name];
};