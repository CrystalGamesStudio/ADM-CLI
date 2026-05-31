# Zsh completion for adm (simple)
#compdef adm
_arguments \
  '1:command:((setup installers))' \
  '--dry-run[Do not execute installers]' \
  '--execute[Execute installers]'
