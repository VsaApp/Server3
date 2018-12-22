#!/bin/bash
mkdir -p out out/unitplan out/teachers out/cafetoria out/workgroups out/calendar
./node_modules/.bin/ts-node src/teachers/teachers.ts
./node_modules/.bin/ts-node src/unitplan/unitplan.ts
./node_modules/.bin/ts-node src/cafetoria/cafetoria.ts
./node_modules/.bin/ts-node src/workgroups/workgroups.ts
./node_modules/.bin/ts-node src/calendar/calendar.ts