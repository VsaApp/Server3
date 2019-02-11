#!/bin/bash
mkdir -p out out/unitplan out/teachers out/cafetoria out/workgroups out/calendar
npx ts-node src/teachers/teachers.ts
npx ts-node src/unitplan/unitplan.ts
npx ts-node src/cafetoria/cafetoria.ts
npx ts-node src/workgroups/workgroups.ts
npx ts-node src/calendar/calendar.ts