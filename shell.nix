{ pkgs ? import <nixpkgs> {} }:

with pkgs;

mkShell rec {
  buildInputs = [ nodejs-10_x sass ];
  shellHook = ''
    source ~/.bashrc
    npm install
  '';
}
