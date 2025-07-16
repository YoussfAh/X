#!/bin/bash
# Build script that forces CI=false
export CI=false
export GENERATE_SOURCEMAP=false
npm run build:internal
