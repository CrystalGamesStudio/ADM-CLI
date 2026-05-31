#!/usr/bin/env bats

@test "installer dry-run outputs DRY RUN and exits 0" {
  run bash ./scripts/installer.sh --dry-run
  [ "$status" -eq 0 ]
  [[ "$output" =~ "DRY RUN" ]]
}
