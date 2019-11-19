import { SubstitutionPlan, Substitution, Timetable, Subject } from "../utils/interfaces";
import { getTimetable } from "../timetable/tt_butler";

const filterSubstitutionPlan = async (substitutionPlan: SubstitutionPlan): Promise<SubstitutionPlan> => {
    const timetable = await getTimetable();
    if (timetable) {
        Object.keys(substitutionPlan.data).forEach((grade: string) => {
            const ttGrade = timetable.grades[grade];
            if (ttGrade) {
                const ttDay = ttGrade.data.days[new Date(substitutionPlan.date).getDay() - 1];
                substitutionPlan.data[grade].forEach((substitution) => {
                    try {
                        if (substitution.type != 2) {
                            const ttUnit = ttDay.units[substitution.unit];
                            // Filter with teacher
                            let subjects = ttUnit.subjects.filter((subject) => {
                                return subject.teacherID === substitution.original.teacherID;
                            });
                            // Filter with subject
                            if (subjects.length !== 1) {
                                subjects = ttUnit.subjects.filter((subject) => {
                                    return subject.subjectID === substitution.original.subjectID;
                                });
                            }
                            // Filter with both
                            if (subjects.length !== 1) {
                                subjects = ttUnit.subjects.filter((subject) => {
                                    return subject.subjectID === substitution.original.subjectID &&
                                        subject.teacherID === substitution.original.teacherID;
                                });
                            }
                            if (subjects.length === 1) {
                                substitution.id = subjects[0].id;
                                substitution.courseID = subjects[0].courseID;

                                // Auto fill a substitution the fix for example empty subjects or rooms
                                autoFillSubstitution(substitution, subjects[0]);
                            } else {
                                console.error(`Cannot filter grade: ${grade} unit: ${substitution.unit}`);
                            }
                        }
                        if (substitution.original.course) {
                            substitution.courseID = `${grade}-${substitution.original.course}-${substitution.original.subjectID}`;
                        }
                    } catch (e) {
                        console.error(`Failed to filter grade: ${grade} unit: ${substitution.unit}`);
                    }
                });
            }
        });
    }
    return substitutionPlan;
}

/**
 * Fills all missing original info to an substitution
 * @param substitution The [substitution] to fill
 * @param subject The [subject] with the [subjectID] of the [substitution]
 */
const autoFillSubstitution = (substitution: Substitution, subject: Subject) => {
    if (substitution.original.subjectID.length === 0) {
        substitution.original.subjectID = subject.subjectID;
    }
    if (substitution.original.roomID.length === 0) {
        substitution.original.roomID = subject.roomID;
    }
}

export default filterSubstitutionPlan;