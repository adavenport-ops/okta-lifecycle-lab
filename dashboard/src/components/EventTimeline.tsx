import type { LifecycleEvent } from '../types'

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; selectedBorder: string; label: string }> = {
  join: { bg: 'bg-green-950/40', text: 'text-green-400', border: 'border-green-800/60', selectedBorder: 'border-l-green-400', label: 'Joiner' },
  move: { bg: 'bg-amber-950/30', text: 'text-amber-400', border: 'border-amber-800/60', selectedBorder: 'border-l-amber-400', label: 'Mover' },
  leave: { bg: 'bg-red-950/30', text: 'text-red-400', border: 'border-red-800/60', selectedBorder: 'border-l-red-400', label: 'Leaver' },
  audit: { bg: 'bg-purple-950/30', text: 'text-purple-400', border: 'border-purple-800/60', selectedBorder: 'border-l-purple-400', label: 'Audit' },
}

const ACTION_LABELS: Record<string, string> = {
  create_user: 'Created Okta user',
  disable_user: 'Disabled Okta account',
  revoke_sessions: 'Revoked sessions',
  add_group: 'Added to group',
  remove_group: 'Removed from group',
  provision_app: 'Provisioned app',
  deprovision_app: 'Deprovisioned app',
  compute_diff: 'Computed access diff',
  post_deprovision_audit: 'Post-deprovision audit',
}

interface Props {
  events: LifecycleEvent[]
  onSelectEvent: (evt: LifecycleEvent) => void
  onSelectUser: (employeeId: string) => void
  selectedEventId: string | null
}

export default function EventTimeline({ events, onSelectEvent, onSelectUser, selectedEventId }: Props) {
  const sorted = [...events].reverse()

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
        <p className="text-lg mb-2">No events yet</p>
        <p className="text-sm font-mono">Run <span className="text-amber-400">lifecycle-lab run --mode sim</span> to generate events</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((evt) => {
        const style = TYPE_STYLES[evt.event_type] || TYPE_STYLES.audit
        const isSelected = selectedEventId === evt.event_id
        const errorCount = evt.actions.filter((a) => a.result === 'failure').length
        const totalMs = evt.actions.reduce((s, a) => s + (a.duration_ms || 0), 0)

        return (
          <div
            key={evt.event_id}
            onClick={() => onSelectEvent(evt)}
            className={`
              ${style.bg} border ${style.border} rounded-lg p-3 cursor-pointer
              transition-all duration-150
              ${isSelected ? `ring-1 ring-amber-400/50 border-l-2 ${style.selectedBorder}` : 'hover:brightness-125'}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.text} bg-black/30`}>
                  {style.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectUser(evt.employee_id) }}
                  className="text-sm font-medium text-gray-200 hover:text-amber-400 transition-colors truncate"
                  title={`View ${evt.employee_name}`}
                >
                  {evt.employee_name}
                </button>
                {evt.department && (
                  <span className="text-xs text-gray-500 hidden sm:inline">{evt.department}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                {errorCount > 0 && (
                  <span className="text-red-400">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
                )}
                {totalMs > 0 && <span className="font-mono">{totalMs.toFixed(0)}ms</span>}
                <span className="font-mono text-gray-600">{formatTime(evt.timestamp)}</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {evt.actions.map((action, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    action.result === 'failure'
                      ? 'bg-red-900/40 text-red-400'
                      : 'bg-gray-800/60 text-gray-400'
                  }`}
                  title={action.details?.group || action.details?.app || action.action}
                >
                  {ACTION_LABELS[action.action] || action.action}
                  {action.details?.group && `: ${action.details.group}`}
                  {action.details?.app && `: ${action.details.app}`}
                  {action.details?.role && ` (${action.details.role})`}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatTime(ts: string): string {
  if (!ts) return ''
  const t = ts.includes('T') ? ts.split('T')[1] : ts
  return t?.slice(0, 8) || ''
}
