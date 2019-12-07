export interface Timetables {
    date: string;
    /** Grades in lowercase */
    grades: TimetableGrades
}

export interface TimetableGrades {
    /** Grades in lowercase */
    [grade: string]: Timetable
}

// Timetable
export interface Timetable {
    /** Grade in lowercase */
    grade: string;
    /** ISO 8601 */
    date: string;
    data: {
        grade: string;
        days: Day[]
    }
}

export interface Day {
    /** Weekday; Monday = 0 */
    day: number;
    units: Unit[];
}

export interface Unit {
    unit: number; // First unit = 0
    subjects: Subject[];
}

export interface Subject {
    /** starts with 0; 6. unit is the lunch break */
    unit: number;  
    /** Format: GRADE-WEEK-DAY-UNIT-SUBJECT_INDEX (lowercase) */
    id: string;  
    /** Format: GRADE-COURSE(BLOCK+TEACHER)-SUBJECT (lowercase) */
    courseID: string;  
    /** subject shorthand for example "e"; "s" */
    subjectID: string; 
    /** teacher shorthand (lowercase) */
    teacherID: string;
    /** lowercase */
    roomID: string;
    /** 0 => A; 1 => B; 2 => AB */
    week: number; 
    block: string;
}


export interface SubstitutionPlan {
    /** ISO 8601 */
    date: string;
    /** ISO 8601 */
    updated: string;
    /** 0 => A; 1 => B */
    week: number; 
    unparsed: SubstitutionPlanGrades;
    data: SubstitutionPlanGrades
}

export interface SubstitutionPlanGrades {
    /** Grades in lowercase */
    [grade: string]: Substitution[]
}

export interface Substitution {
    /** starts with 0; 6. unit is the lunch break */
    unit: number;
    /** 0 => substitution; 1 => free lesson; 2 => exam */
    type: number;
    info: string;
    id: string | undefined;
    /** Format: GRADE - COURSE(BLOCK|TEACHER) - SUBJECT(lowercase) */
    courseID: string | undefined;
    original: SubstitutionDetails;
    changed: SubstitutionDetails;
}

export interface SubstitutionDetails {
    /** teacher in lowercase */
    teacherID: string;
    /**subject in lowercase (without number) */
    subjectID: string;
    /**room in lowercase (without blanks & max 3 letters) */
    roomID: string;
    course?: string;
}

// Updates
export interface UpdateData {
    /** ISO 8601 */
    timetable: string; // 
    /** ISO 8601 */
    substitutionPlan: string;
    /** ISO 8601 */
    cafetoria: string;
    /** ISO 8601 */
    calendar: string;
    /** ISO 8601 */
    teachers: string;
    /** ISO 8601 */
    workgroups: string;
    /** ISO 8601 */
    subjects: string;
    /** ISO 8601 */
    rooms: string;
    minAppLevel: number;
    /** Grade in lowercase */
    grade: string;
}

export interface Tags {
    /** Grade in lowercase */
    grade: string;
    group: number; // 1 (pupil); 2 (teacher); 4 (developer); 8 (other)
    selected: string[]; // course list
    exams: string[]; // course list
    cafetoria: CafetoriaLogin;
    timestamp: string; // iso date
}

export interface CafetoriaLogin {
    id: string | undefined;
    password: string | undefined;
    timestamp: string;
}

export interface User {
    username: string;
    /** Grade in lowercase */ 
    grade: string;
    group: number; // 1 (pupil); 2 (teacher); 4 (developer); 8 (other)
    devices: Device[];
    selected: Course[]; // course list
    exams: string[]; // course list
    cafetoria: CafetoriaLogin;
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
    /** day index list with notification UPDATED_DAY-DATE_SINCE_EPOCHE-TEXT_HASH
     * example: 28-18229-d8345b3416426541733f126ade0de8b7
     */
    lastNotifications: string[]
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