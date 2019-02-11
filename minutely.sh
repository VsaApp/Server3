#!/bin/bash
mkdir -p out out/replacementplan out/replacementplan/today out/replacementplan/tomorrow
npx ts-node src/replacementplan/replacementplan.ts