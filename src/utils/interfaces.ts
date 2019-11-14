export interface Timetables {
    date: string;
    grades: Map<string, Timetable>
}

// Timetable
export interface Timetable {
    grade: string;
    date: string; // ISO 8601
    data: {
        grade: string; 
        days: Day[]
    }
}

export interface Day {
    day: number; // Weekday; Monday = 0
    units: Unit[];
}

export interface Unit {
    unit: number; // First unit = 0
    subjects: Subject[];
}

export interface Subject {
    unit: number; // starts with 0; 6. unit is the lunch break
    id: string; // Format: GRADE-WEEK-DAY-UNIT-SUBJECTINDEX (lowercase)
    courseID: string; // Format: GRADE-COURSE(BLOCK|TEACHER)-SUBJECT (lowercase)
    subjectID: string; // subject shorthand for example "E"; "S"
    teacherID: string; // teacher shorthand (lowercase)
    roomID: string;
    week: number; // 0 => A; 1 => B; 2 => AB
    block: string;
}


// Timetable
export interface SubstitutionPlan {
    date: string; // ISO 8601
    updated: string; // ISO 8601
    week: number; // 0 => A; 1 => B
    unparsed: { 
        // Parser was able to parse the grade
        "5a": string[]; 
        "5b": string[];
        "5c": string[];
        "6a": string[];
        "6b": string[];
        "6c": string[];
        "7a": string[];
        "7b": string[];
        "7c": string[];
        "8a": string[];
        "8b": string[];
        "8c": string[];
        "9a": string[];
        "9b": string[];
        "9c": string[];
        "ef": string[];
        "q1": string[];
        "q2": string[];
        // Parser was not able to parse grade
        "other": string[]   
    };
    data: {
        "5a": Substitution[];
        "5b": Substitution[];
        "5c": Substitution[];
        "6a": Substitution[];
        "6b": Substitution[];
        "6c": Substitution[];
        "7a": Substitution[];
        "7b": Substitution[];
        "7c": Substitution[];
        "8a": Substitution[];
        "8b": Substitution[];
        "8c": Substitution[];
        "9a": Substitution[];
        "9b": Substitution[];
        "9c": Substitution[];
        "ef": Substitution[];
        "q1": Substitution[];
        "q2": Substitution[]
    }
}

export interface Substitution {
    unit: number; // starts with 0; 6. unit is the lunch break
    type: number; // 0 => substitution; 1 => free lesson; 2 => exam
    info: string;
    id: string | undefined;
    courseID: string | undefined;
    original: SubstitutionDetails;
    changed: SubstitutionDetails;
}

export interface SubstitutionDetails {
    teacherID: string; // teacher in lowercase
    subjectID: string; // subject in lowercase (without number)
    roomID: string; // room in lowercase (without blanks & max 3 letters)
}

// Updates
export interface UpdateData {
    timetable: string; // ISO 8601
    substitutionPlan: string; // ISO 8601
    cafetoria: string; // ISO 8601
    calendar: string; // ISO 8601
    teachers: string; // ISO 8601
    workgroups: string; // ISO 8601
    subjects: string; // ISO 8601
    rooms: string; // ISO 8601
    minAppLevel: number; 
    grade: string;
}

export interface Tags {
    grade: string;
    group: number; // 1 (pupil); 2 (teacher); 4 (developer); 8 (other)
    selected: string[]; // course list
    exams: string[]; // course list
    timestamp: string; // iso date
}

export interface User {
    username: string;
    grade: string;
    group: number; // 1 (pupil); 2 (teacher); 4 (developer); 8 (other)
    devices: Device[];
    selected: Course[]; // course list
    exams: string[]; // course list
    timestamp: string; // iso date
    lastActive: string; // iso date
}

export interface Course {
    courseID: string;
    subjectIDs: string[]
}

export interface Device {
    os: string;
    name: string;
    appVersion: string;
    notifications: boolean;
    firebaseId: string;
    language: string;
}

export interface Cafetoria {
    saldo: number | undefined;
    error: string | undefined;
    days: CafetoriaDay[];
}

export interface CafetoriaDay {
    day: number;
    date: string;
    menus: Menu[]
}

export interface Menu {
    name: string;
    time: string;
    price: number;
}

export interface Calendar {
    years: number[],
    data: Event[]
}

export interface Event {
    name: string;
    info: string;
    start: string; // ISO date
    end: string | undefined; // ISO date
}

export interface Teacher {
    shortName: string;
}

export interface WorkgroupsDay {
    weekday: number;
    data: Workgroup[]
}

export interface Workgroup {
    name: string;
    participants: string;
    time: string;
    place: string;
}