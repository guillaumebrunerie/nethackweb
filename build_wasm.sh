#!/usr/bin/zsh

cd build/nethack

# Configure
./sys/unix/setup.sh ./sys/unix/hints/linux.370

# Fetch Lua
make fetch-lua

# Build
make CROSS_TO_WASM=1

# Copy built files
cp ./targets/wasm/nethack.{js,wasm} ..

# Write the commit hash to a file
COMMIT_HASH=$(git rev-parse HEAD)
echo "NetHack WebAssembly build compiled from commit $COMMIT_HASH" > ../build-info.txt
