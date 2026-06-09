#!/usr/bin/env zsh

cd build/nethack

# Configure
./sys/unix/setup.sh ./sys/unix/hints/linux.500

# Fetch Lua
make fetch-lua

# Opt out of Nix's reproducible-build epoch so __DATE__ in the version banner
# reflects the actual build date instead of 1980-01-01.
unset SOURCE_DATE_EPOCH

# Build (uses explicit wasm target which sets CROSS_TO_WASM=1 in src/)
make wasm

# Copy built files
cp ./targets/wasm/nethack.{js,wasm} ..

# Write the commit hash to a file
COMMIT_HASH=$(git rev-parse HEAD)
echo "NetHack WebAssembly build compiled from commit $COMMIT_HASH" > ../build-info.txt
