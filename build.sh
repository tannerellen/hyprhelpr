#!/bin/bash

mkdir -p ./bin

bun build --compile --minify --sourcemap --bytecode --target=bun-linux-x64-baseline ./index.js --outfile bin/hyprhelpr
