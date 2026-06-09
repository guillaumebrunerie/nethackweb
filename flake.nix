{
  description = "nethackweb dev shell — frontend (vite/react) and NetHack wasm cross-compile";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22

            emscripten
            gnumake
            bison
            flex
            perl
            python3
            groff
            coreutils
            curl
            git
            zsh
          ];

          shellHook = ''
            export EM_CACHE="$PWD/.emcache"
            mkdir -p "$EM_CACHE"

            echo "nethackweb dev shell"
            echo "  node: $(node --version)"
            echo "  emcc: $(emcc --version | head -n1)"
            echo "  EM_CACHE=$EM_CACHE"
          '';
        };
      });
}
