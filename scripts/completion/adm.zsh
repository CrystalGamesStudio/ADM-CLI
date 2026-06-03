#compdef adm

_adm() {
  local -a commands subcommands opts

  commands=(
    'setup:Run interactive setup wizard'
    'installers:Plan or run environment installers'
    'connect:Manage service connections'
    'pr:Manage pull requests'
    'mr:Manage merge requests (GitLab)'
    'issue-list:List issues from connected platforms'
    'dotfiles:Manage dotfiles sync'
    'clock:ASCII clock'
    'theme:Choose a color theme'
    'uninstall:Remove ADM config and references'
    'assistant:Launch interactive assistant shell'
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
        installers)
          _arguments '--dry-run[Plan only, do not execute]' '--execute[Execute installers (requires ADM_EXECUTE=1)]'
          ;;
        connect)
          local -a connect_subs
          connect_subs=('github:Connect GitHub account' 'gitlab:Connect GitLab account' 'list:List connected services' 'disconnect:Disconnect a service')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' connect_subs
          else
            case $words[2] in
              github|gitlab) _arguments '--token[Access token]' ;;
            esac
          fi
          ;;
        pr)
          local -a pr_subs
          pr_subs=('list:List open pull requests' 'draft:Create a draft PR' 'comment:Comment on a pull request')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' pr_subs
          else
            case $words[2] in
              list) _arguments '--repo[Filter by repo (owner/name)]' '--limit[Max results]:limit:' ;;
              draft) _arguments '--base[Base branch]:branch:' ;;
            esac
          fi
          ;;
        mr)
          local -a mr_subs
          mr_subs=('list:List open merge requests' 'draft:Create a draft MR' 'comment:Comment on a merge request')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' mr_subs
          else
            case $words[2] in
              list) _arguments '--limit[Max results]:limit:' ;;
              draft|comment) _arguments '--project-id[GitLab project ID]:id:' '--source-branch[Source branch]:branch:' ;;
            esac
          fi
          ;;
        issue-list)
          _arguments '--platform[Filter by platform]:platform:(github gitlab)' '--limit[Max results]:limit:'
          ;;
        dotfiles)
          local -a dotfiles_subs
          dotfiles_subs=('sync:Clone/pull dotfiles repo and symlink files')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' dotfiles_subs
          else
            case $words[2] in
              sync) _arguments '--repo[Dotfiles repo URL]:url:' '--copy[Copy files instead of symlinking]' '--only[Sync only specified files]:files:' ;;
            esac
          fi
          ;;
        clock)
          local -a clock_subs
          clock_subs=('theme:Pick clock accent color')
          if (( CURRENT == 2 )); then
            _describe 'subcommand' clock_subs
          fi
          ;;
        assistant)
          _arguments '--api-key[GLM API key]:key:'
          ;;
      esac
      ;;
  esac
}

_adm "$@"
