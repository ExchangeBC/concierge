{ pkgs ? import <nixpkgs> {} }:

with pkgs;

mkShell rec {
  buildInputs = [ nodejs-10_x sass mongodb mongodb-tools docker_compose openshift ];
  shellHook = ''
    source ~/.bashrc
    npm install
  '';
}
