# Bash completion for adm
_adm_completion() {
  local cur prev opts commands
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  commands="setup installers connect pr mr issue-list dotfiles clock theme uninstall assistant"

  # Top-level commands
  if [[ ${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
    return 0
  fi

  # Subcommands and options based on the command
  case "${COMP_WORDS[1]}" in
    setup)
      COMPREPLY=( $(compgen -W "--dry-run --help" -- ${cur}) )
      return 0
      ;;
    installers)
      COMPREPLY=( $(compgen -W "--dry-run --execute --help" -- ${cur}) )
      return 0
      ;;
    connect)
      local connect_subs="github gitlab list disconnect"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${connect_subs}" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "github" || "${COMP_WORDS[2]}" == "gitlab" ]]; then
        COMPREPLY=( $(compgen -W "--token --help" -- ${cur}) )
      fi
      return 0
      ;;
    pr)
      local pr_subs="list draft comment"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${pr_subs}" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "list" ]]; then
        COMPREPLY=( $(compgen -W "--repo --limit --help" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "draft" ]]; then
        COMPREPLY=( $(compgen -W "--base --help" -- ${cur}) )
      fi
      return 0
      ;;
    mr)
      local mr_subs="list draft comment"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${mr_subs}" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "list" ]]; then
        COMPREPLY=( $(compgen -W "--limit --help" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "draft" || "${COMP_WORDS[2]}" == "comment" ]]; then
        COMPREPLY=( $(compgen -W "--project-id --source-branch --help" -- ${cur}) )
      fi
      return 0
      ;;
    issue-list)
      COMPREPLY=( $(compgen -W "--platform --limit --help" -- ${cur}) )
      return 0
      ;;
    dotfiles)
      local dotfiles_subs="sync"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${dotfiles_subs}" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "sync" ]]; then
        COMPREPLY=( $(compgen -W "--repo --copy --only --help" -- ${cur}) )
      fi
      return 0
      ;;
    clock)
      local clock_subs="theme"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${clock_subs}" -- ${cur}) )
      fi
      return 0
      ;;
    theme)
      return 0
      ;;
    uninstall)
      return 0
      ;;
    assistant)
      COMPREPLY=( $(compgen -W "--api-key --help" -- ${cur}) )
      return 0
      ;;
  esac
}
complete -F _adm_completion adm
