#!/bin/bash
mkdir -p out out/unitplan out/teachers
./node_modules/.bin/ts-node src/teachers/teachers.ts
./node_modules/.bin/ts-node src/unitplan/unitplan.ts