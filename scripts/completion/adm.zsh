#compdef adm

_adm() {
  local -a commands subcommands opts

  commands=(
    'help:Show command reference'
    'exit:Exit ADM'
    'clear:Clear message history'
    'theme:List or switch themes'
    'config:Show current configuration'
    'status:Show git status'
    'ai:Toggle AI mode or ask a question'
    'model:Show or switch AI provider'
    'setup:Launch extension setup wizard'
    'connect:Connect to GitHub or GitLab'
    'pr:Pull request operations'
    'mr:Merge request operations (GitLab)'
    'issue:List issues from connected platform'
    'commit:Commit subcommands'
    'clock:Show ASCII clock'
    'dotfiles:Sync dotfiles from repo'
    'uninstall:Remove ADM CLI config'
    'plugins:List loaded plugins'
  )

  _arguments -C \
    '1:command:->command' \
    '*::arg:->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
    args)
      case $words[1] in
        setup)
          _arguments '--dry-run[Preview planned actions without executing]'
          ;;
        connect)
          local -a connect_subs
          connect_subs=('github:Connect GitHub account' 'gitlab:Connect GitLab account' 'list:List connected services' 'disconnect:Disconnect a service')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' connect_subs
          else
            case $words[2] in
              github|gitlab) _arguments '--token[Access token]:token:' ;;
            esac
          fi
          ;;
        pr)
          local -a pr_subs
          pr_subs=('list:List open pull requests' 'draft:Create a draft PR' 'comment:Comment on a pull request')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' pr_subs
          fi
          ;;
        mr)
          local -a mr_subs
          mr_subs=('list:List open merge requests' 'draft:Create a draft MR' 'comment:Comment on a merge request')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' mr_subs
          fi
          ;;
        issue)
          _arguments '1:subcommand:(list)'
          ;;
        commit)
          _arguments '1:subcommand:(suggest)'
          ;;
        dotfiles)
          local -a dotfiles_subs
          dotfiles_subs=('sync:Clone/pull dotfiles repo and symlink files')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' dotfiles_subs
          fi
          ;;
        theme)
          _arguments '1:theme:(dark light cyberpunk nord forest monokai)'
          ;;
        model)
          _arguments '1:provider:(glm-free glm-pro openai anthropic ollama list)'
          ;;
      esac
      ;;
  esac
}

_adm "$@"
