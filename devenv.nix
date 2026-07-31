{ pkgs, ... }:

{
  languages = {
    # https://devenv.sh/languages/javascript/
    javascript = {
      enable = true;
      package = pkgs.nodejs_24;
      lsp.enable = true;

      nodejs.enable = true;
      corepack.enable = true;

      pnpm = {
        enable = true;
        install.enable = true;
      };
    };

    # https://devenv.sh/languages/typescript/
    typescript = {
      enable = true;
      lsp.enable = true;
    };
  };
}
