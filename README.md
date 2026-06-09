# NetHackWeb

This is a browser/mobile implementation of NetHack, based on NetHack 5.0's
support for cross compilation to WebAssembly. Thank you in particular to
apowers313 who did the ground work when it comes to cross compilation to
WebAssembly (https://github.com/NetHack/NetHack/pull/385).

If you just want to play, go to https://guillaumebrunerie.github.io/nethack.

If you are interested in the source code, keep reading.

# File structure

- `build` contains NetHack compiled to WebAssembly (the `nethack.js` and
  `nethack.wasm` files). To compile it yourself, get NetHack's source code from
  git, install emscripten, and run:

  ```
  make fetch-lua
  ./sys/unix/setup.sh ./sys/unix/hints/linux.500
  make wasm
  ```

  Then you will find `nethack.js` and `nethack.wasm` in `./targets/wasm`. You
  might need to tweak things to make it work on your system. If you have Nix,
  `nix develop` (via the included flake) provides emscripten, GNU coreutils,
  groff, and the rest of the toolchain.

- `lib` contains a Typescript interface to NetHack's APIs for supporting
  different windowing systems. For documentation, check
  https://github.com/NetHack/NetHack/blob/NetHack-5.0/doc/window.txt.

  The main function it exports is `startNethack` which takes as first argument
  an object containing a function field (or method) for each method supported by
  NetHack (see above). So for instance you would use it like this:

  ```js
  startNethack({
    rawprint(str) {
      [...]
    },
    ...
  })
  ```

  The Typescript interface is meant to be as close as possible to the official
  one, but with Typescript types and conventions. Note in particular:

  - All method names are converted from snake_case to camelCase. So
    `print_glyph` becomes `printGlyph`, etc.
  - Most enum-like data types are changed from integers to unions of literal
    strings.
  - Functions are made async whenever appropriate.
  - The `status_update` method is split in two different methodes:
    `statusUpdate` and `statusUpdateConditions` (read the documentation and
    you'll understand why).
  - Some functions pass pointers and expect you to use them as output values,
    this is here changed to regular output values (see for instance `nh_poskey`
    and `select_menu`). In particular, you should not have to deal with pointers
    at all when using this library.
  - `player_selection` is an async function that returns either `null` or an
    object containing the name/role/race/gender/alignment chosen. If you return
    `null`, it will fallback to the default tty player selection.

  A few other functions are exported, for instance

  - `getExtCmdIndex`: returns the index of a given extended command
  - `getUniqueExtCmdAutocomplete`: returns the extended command (with its
    description) corresponding to the given prefix (and taking autocomplete into
    account)
  - `copyrightMessage`: returns an array of strings containing the copyright
    messages
  - `flags`/`iflags`: returns the current flags/iflags, which are needed in some
    circumstances
  - `getRoleData/getRaceData/getGenderData/getAlignData`: returns data on which
    roles/races/genders/alignments are available, and how they relate to each
    other

- `src` is an actual implementation of a windowing system based on the `lib`
  interface above. It is written in React and is meant to work both in the
  browser and on mobile. Notes:

  - It only supports IBMGraphics (no tiles).
  - The default config is in `src/nethackrc.txt`; users can edit it in the
    settings dialog and the value persists across reloads.
  - Saves, high scores, bones, and the rc file persist via IDBFS in
    IndexedDB. Save-on-hide fires on `visibilitychange` and `pagehide`, so
    backgrounding the tab or PWA writes a save before the OS suspends it.
  - Installs as a PWA (manifest + service worker) for offline play.
