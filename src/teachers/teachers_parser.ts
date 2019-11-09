import { Teacher } from '../utils/interfaces';

const extractData = (data: any): Teacher[] => {
    const list: Teacher[] = [];
    data.pageTables.forEach((page: any) => {
        page.tables.forEach((line: string[]) => {
            if (line[0].length === 0 || line[0] === 'Fakultenliste') return;
            let teacher: Teacher = {
                shortName: ''
            };
            teacher.shortName = line[0].slice(-3);
            list.push(teacher);
        });
    });
    return list;
};

export default extractData;