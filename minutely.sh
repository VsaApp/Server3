#!/bin/bash
mkdir -p out out/replacementplan out/replacementplan/today out/replacementplan/tomorrow
./node_modules/.bin/ts-node src/replacementplan/replacementplan.ts --dev