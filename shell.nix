{ pkgs ? import <nixpkgs> {} }:

with pkgs;

mkShell rec {
  buildInputs = [ nodejs-10_x sass mongodb docker_compose ];
  shellHook = ''
    source ~/.bashrc
    npm install
  '';
}
