#!/bin/bash
mkdir -p out out/unitplan out/teachers out/cafetoria
./node_modules/.bin/ts-node src/teachers/teachers.ts
./node_modules/.bin/ts-node src/unitplan/unitplan.ts
./node_modules/.bin/ts-node src/cafetoria/cafetoria.ts