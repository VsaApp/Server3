import { SubstitutionPlan } from "../utils/interfaces";
import { getTimetable } from "../timetable/tt_butler";

const filterSubstitutionPlan = async (substitutionPlan: SubstitutionPlan): Promise<SubstitutionPlan> => {
    const timetable = await getTimetable();
    if (timetable) {
        Object.keys(substitutionPlan.data).forEach((grade: string) => {
            const ttGrade = timetable.grades.get(grade);
            if (ttGrade) {
                const ttDay = ttGrade.data.days[new Date(substitutionPlan.date).getDay() - 1];
                substitutionPlan.data[grade].forEach((substitution) => {
                    try {
                        if (substitution.type != 2) {
                            const ttUnit = ttDay.units[substitution.unit];
                            const subjects = ttUnit.subjects.filter((subject) => {
                                return subject.subjectID === substitution.original.subjectID &&
                                    subject.teacherID === substitution.original.teacherID;
                            });
                            if (subjects.length === 1) {
                                substitution.id = subjects[0].id;
                                substitution.courseID = subjects[0].courseID;
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

export default filterSubstitutionPlan;