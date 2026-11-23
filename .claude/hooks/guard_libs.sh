#!/usr/bin/env bash
# PreToolUse(Bash): block deleting / moving the saved reusable libraries (puppet, motion, backgrounds, reference, voice).
cmd=$(jq -r '.tool_input.command // ""')
if printf '%s' "$cmd" | grep -Eq '(^|[;&|(`[:space:]])(rm|rmdir|unlink|shred|mv|git[[:space:]]+rm|git[[:space:]]+mv|find[^;&|]*-delete|truncate)([[:space:]]|$)' \
   && printf '%s' "$cmd" | grep -Eq 'assets/(character|motion|env|reference|voice)|assets/?([[:space:];&|)]|$)|assets/\*'; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Blocked by project hook: the saved libraries in pack/Stick3D-Pack/assets (character puppet, motion, env backgrounds, reference, voice) must never be deleted or moved. Add new versions next to them instead."}}'
fi
exit 0
