import fs from 'fs';


let files = fs.readdirSync('out/unitplan/');
files = files.filter((file: string) => {
  return file.length < 8;
});

files.forEach((file: string) => {
file = 'out/unitplan/' + file;

const content = JSON.parse(fs.readFileSync(file, 'utf-8'));

let all = 0;
let notDirectly = 0;

content.data.forEach((day: any) => {
  Object.keys(day.lessons).forEach((unit: string) => {
    let subjects = day.lessons[unit];
    subjects = subjects.filter((subject: any) => {
      return subject.participant !== '';
    });
    const count: any = {};
    subjects.forEach((i: any) => { count[i.subject] = (count[i.subject] || 0) + 1;});
    if (Object.keys(count).length == 0) return;
    Object.keys(count).forEach((subject: string) => {
      if (count[subject] == 1) delete count[subject];
    });
    all++;
    if (Object.keys(count).length > 0) {
      notDirectly++;
    }
  });
});

console.log(file.replace('.json', '').replace('out/unitplan/', '') , (notDirectly / all * 100).toFixed(2), '%');

});
