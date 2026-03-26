import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { LifecycleEvent, EventEntry } from '../types'

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; selectedBorder: string; dot: string; label: string }> = {
  join:  { bg: 'bg-green-950/30', text: 'text-green-400', border: 'border-green-900/40', selectedBorder: 'border-l-green-400', dot: 'bg-green-400', label: 'JOINER' },
  move:  { bg: 'bg-amber-950/20', text: 'text-amber-400', border: 'border-amber-900/40', selectedBorder: 'border-l-amber-400', dot: 'bg-amber-400', label: 'MOVER' },
  leave: { bg: 'bg-red-950/20',   text: 'text-red-400',   border: 'border-red-900/40',   selectedBorder: 'border-l-red-400',   dot: 'bg-red-400',   label: 'LEAVER' },
  audit: { bg: 'bg-purple-950/20', text: 'text-purple-400', border: 'border-purple-900/40', selectedBorder: 'border-l-purple-400', dot: 'bg-purple-400', label: 'AUDIT' },
}

interface Props {
  events: LifecycleEvent[]
  onSelectEvent: (evt: LifecycleEvent) => void
  onSelectUser: (employeeId: string) => void
  selectedEventId: string | null
  filter: string | null
}

export default function EventTimeline({ events, onSelectEvent, onSelectUser, selectedEventId, filter }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const filtered = filter ? events.filter((e) => e.event_type === filter) : events
  const sorted = [...filtered].reverse()

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-[#131620] border border-gray-800/50 rounded-lg p-8 text-center text-gray-500">
        <p className="text-sm">No events to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((evt) => {
        const style = TYPE_STYLES[evt.event_type] || TYPE_STYLES.audit
        const isSelected = selectedEventId === evt.event_id
        const isExpanded = expandedIds.has(evt.event_id)
        const errorCount = evt.actions.filter((a) => a.result === 'failure').length
        const totalMs = evt.actions.reduce((s, a) => s + (a.duration_ms || 0), 0)
        const diffAction = evt.actions.find((a) => a.action === 'compute_diff')

        return (
          <div
            key={evt.event_id}
            className={`
              ${style.bg} border ${style.border} rounded-lg overflow-hidden cursor-pointer
              transition-all duration-150
              ${isSelected ? `ring-1 ring-amber-400/40 border-l-2 ${style.selectedBorder}` : 'border-l-2 border-l-transparent hover:brightness-125'}
            `}
          >
            {/* Summary row */}
            <div
              className="px-3 py-2.5"
              onClick={() => { onSelectEvent(evt); toggleExpand(evt.event_id) }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text} shrink-0`}>
                    {style.label}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectUser(evt.employee_id) }}
                    className="text-sm font-medium text-gray-200 hover:text-amber-400 transition-colors truncate"
                  >
                    {evt.employee_name}
                  </button>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 text-xs text-gray-500">
                  {errorCount > 0 && (
                    <span className="text-red-400 text-[10px] font-mono">{errorCount} err</span>
                  )}
                  <span className="font-mono text-[11px]">{totalMs.toFixed(0)}ms</span>
                  <span className="font-mono text-gray-600 text-[11px]">{formatTime(evt.timestamp)}</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                </div>
              </div>

              {/* Subtitle line */}
              <div className="flex items-center gap-2 mt-1 ml-4 text-[11px] text-gray-500">
                {evt.event_type === 'move' && diffAction?.details?.previous_department ? (
                  <span>
                    <span className="text-red-400/70">{diffAction.details.previous_department}</span>
                    <span className="text-gray-600 mx-1">&rarr;</span>
                    <span className="text-green-400/70">{evt.department}</span>
                    <span className="text-gray-600 mx-1.5">&middot;</span>
                    <span>{evt.title}</span>
                  </span>
                ) : (
                  <span>{evt.title} &middot; {evt.department}</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex gap-0.5 mt-2 ml-4">
                {evt.actions.map((action, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full flex-1 ${
                      action.result === 'failure' ? 'bg-red-500' :
                      action.result === 'retry' ? 'bg-amber-500' :
                      'bg-green-500/60'
                    }`}
                    title={`${action.action}${action.details?.group ? `: ${action.details.group}` : ''}${action.details?.app ? `: ${action.details.app}` : ''}`}
                    style={{ maxWidth: '32px' }}
                  />
                ))}
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-gray-800/50 px-3 py-2.5 space-y-2">
                {/* HRIS event box */}
                <div className="bg-black/20 border border-gray-800/40 rounded px-3 py-2 text-[11px]">
                  <div className="text-gray-500 font-mono mb-1">
                    HRIS Event &middot; Source: Sapling
                  </div>
                  <div className="text-gray-400">
                    {evt.event_type === 'join' && <span>employee.created</span>}
                    {evt.event_type === 'move' && <span>employee.updated</span>}
                    {evt.event_type === 'leave' && <span>employee.terminated</span>}
                    <span className="text-gray-600 mx-1.5">&middot;</span>
                    {evt.email}
                  </div>
                  {evt.event_type === 'move' && diffAction?.details && (
                    <div className="mt-1 text-gray-500">
                      {diffAction.details.previous_department && (
                        <div>Dept: {diffAction.details.previous_department} &rarr; {evt.department}</div>
                      )}
                      {diffAction.details.previous_title && (
                        <div>Title: {diffAction.details.previous_title} &rarr; {evt.title}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Access diff for movers */}
                {evt.event_type === 'move' && diffAction?.details && (
                  <MiniDiff details={diffAction.details} />
                )}

                {/* API call log */}
                <div className="space-y-0.5">
                  {evt.actions.map((action, i) => (
                    <ActionRow key={i} action={action} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MiniDiff({ details }: { details: NonNullable<EventEntry['details']> }) {
  const groupsAdd = details.groups_to_add || []
  const groupsRemove = details.groups_to_remove || []
  const appsAdd = details.apps_to_provision || {}
  const appsDel = details.apps_to_deprovision || []

  if (groupsAdd.length === 0 && groupsRemove.length === 0 && Object.keys(appsAdd).length === 0 && appsDel.length === 0) return null

  return (
    <div className="bg-black/20 border border-gray-800/40 rounded overflow-hidden">
      <div className="grid grid-cols-2 text-[10px]">
        <div className="px-3 py-2 border-r border-gray-800/40">
          <div className="text-red-400 font-bold uppercase tracking-wider mb-1.5">Revoked</div>
          {groupsRemove.map((g) => (
            <div key={g} className="text-red-300/70 font-mono py-0.5">- {g}</div>
          ))}
          {appsDel.map((a) => (
            <div key={a} className="text-red-300/70 font-mono py-0.5">- {a}</div>
          ))}
          {groupsRemove.length === 0 && appsDel.length === 0 && (
            <div className="text-gray-700 py-0.5">None</div>
          )}
        </div>
        <div className="px-3 py-2">
          <div className="text-green-400 font-bold uppercase tracking-wider mb-1.5">Granted</div>
          {groupsAdd.map((g) => (
            <div key={g} className="text-green-300/70 font-mono py-0.5">+ {g}</div>
          ))}
          {Object.entries(appsAdd).map(([app, role]) => (
            <div key={app} className="text-green-300/70 font-mono py-0.5">+ {app} ({role})</div>
          ))}
          {groupsAdd.length === 0 && Object.keys(appsAdd).length === 0 && (
            <div className="text-gray-700 py-0.5">None</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionRow({ action }: { action: EventEntry }) {
  const method = action.details?.http_method || ''
  const endpoint = action.details?.http_endpoint || ''
  const status = action.details?.http_status
  const isFail = action.result === 'failure'
  const isRetry = action.result === 'retry'

  const methodColor = method === 'POST' ? 'text-green-400' :
    method === 'PUT' || method === 'PATCH' ? 'text-amber-400' :
    method === 'DELETE' ? 'text-red-400' : 'text-gray-400'

  const statusColor = status && status >= 400 ? 'text-red-400' :
    status && status >= 200 && status < 300 ? 'text-green-500' :
    'text-gray-400'

  return (
    <div className={`flex items-center gap-2 text-[10px] font-mono py-0.5 px-1 rounded ${
      isFail ? 'bg-red-950/20' : isRetry ? 'bg-amber-950/10' : ''
    }`}>
      <span className={`w-3 text-center ${isFail ? 'text-red-400' : isRetry ? 'text-amber-400' : 'text-green-500'}`}>
        {isFail ? '\u2717' : isRetry ? '\u21bb' : '\u2713'}
      </span>
      {method && <span className={`${methodColor} w-10 shrink-0`}>{method}</span>}
      {endpoint && <span className="text-gray-500 truncate flex-1">{endpoint}</span>}
      {status && <span className={`${statusColor} shrink-0`}>{status}</span>}
      {action.duration_ms && <span className="text-gray-600 shrink-0 w-12 text-right">{action.duration_ms}ms</span>}
      {action.error && <span className="text-red-400/70 truncate ml-1" title={action.error}>{action.error.slice(0, 50)}</span>}
      {!method && !endpoint && (
        <span className="text-gray-500">
          {action.action.replace(/_/g, ' ')}
          {action.details?.group && `: ${action.details.group}`}
          {action.details?.app && `: ${action.details.app}`}
          {action.details?.role && ` (${action.details.role})`}
        </span>
      )}
    </div>
  )
}

function formatTime(ts: string): string {
  if (!ts) return ''
  const t = ts.includes('T') ? ts.split('T')[1] : ts
  return t?.slice(0, 8) || ''
}
