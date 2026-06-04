# Bash completion for adm (TUI mode — all commands use / prefix)
_adm_completion() {
  local cur prev
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  local commands="help exit clear theme config status ai model setup connect pr mr issue commit clock dotfiles uninstall plugins"

  # Top-level completion (first word or after adm)
  if [[ ${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
    return 0
  fi

  # Subcommands
  case "${COMP_WORDS[1]}" in
    help|exit|clear|uninstall|plugins|status)
      return 0
      ;;
    setup)
      COMPREPLY=( $(compgen -W "--dry-run" -- ${cur}) )
      return 0
      ;;
    connect)
      local connect_subs="github gitlab list disconnect"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${connect_subs}" -- ${cur}) )
      elif [[ "${COMP_WORDS[2]}" == "github" || "${COMP_WORDS[2]}" == "gitlab" ]]; then
        COMPREPLY=( $(compgen -W "--token" -- ${cur}) )
      fi
      return 0
      ;;
    pr)
      local pr_subs="list draft comment"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${pr_subs}" -- ${cur}) )
      fi
      return 0
      ;;
    mr)
      local mr_subs="list draft comment"
      if [[ ${COMP_CWORD} -eq 2 ]]; then
        COMPREPLY=( $(compgen -W "${mr_subs}" -- ${cur}) )
      fi
      return 0
      ;;
    issue)
      COMPREPLY=( $(compgen -W "list" -- ${cur}) )
      return 0
      ;;
    commit)
      COMPREPLY=( $(compgen -W "suggest" -- ${cur}) )
      return 0
      ;;
    theme)
      local themes="dark light cyberpunk nord forest monokai"
      COMPREPLY=( $(compgen -W "${themes}" -- ${cur}) )
      return 0
      ;;
    model)
      local providers="glm-free glm-pro openai anthropic ollama list"
      COMPREPLY=( $(compgen -W "${providers}" -- ${cur}) )
      return 0
      ;;
    dotfiles)
      COMPREPLY=( $(compgen -W "sync --repo --copy" -- ${cur}) )
      return 0
      ;;
    clock)
      return 0
      ;;
    ai)
      return 0
      ;;
    config)
      return 0
      ;;
  esac
}
complete -F _adm_completion adm
