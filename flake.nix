{
  description = "aetheryte-radio";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    utils,
    nixpkgs,
  }:
    utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
      };
    in
      with pkgs; {
      devShell = mkShell {
        buildInputs = [
          awscli2
        ];
      };
    });
}
