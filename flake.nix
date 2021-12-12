{
  description = "Development environment for the Procurement Concierge web application.";

  inputs = {
    nixpkgs = { url = github:nixos/nixpkgs/nixpkgs-unstable; };
    flake-utils = { url = github:numtide/flake-utils; };
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        #pkgs = nixpkgs.legacyPackages.${system};
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        shell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-14_x
            sass
            docker
            docker-compose
            openshift
          ];
        };
      in
      { devShell = shell; });
}
