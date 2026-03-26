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

            {/* Expanded detail — structured by event type */}
            {isExpanded && (
              <div className="border-t border-gray-800/50 px-3 py-2.5 space-y-3">
                {evt.event_type === 'join' && <JoinerExpanded evt={evt} />}
                {evt.event_type === 'move' && <MoverExpanded evt={evt} diffAction={diffAction} />}
                {evt.event_type === 'leave' && <LeaverExpanded evt={evt} />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── JOINER EXPANDED ───────────────────────────────────────────────────────────

function JoinerExpanded({ evt }: { evt: LifecycleEvent }) {
  const createUser = evt.actions.find((a) => a.action === 'create_user')
  const groups = evt.actions.filter((a) => a.action === 'add_group' && a.details?.group)
  const apps = evt.actions.filter((a) => a.action === 'provision_app' && a.details?.app)
  return (
    <>
      {/* HRIS Event */}
      <HRISBox
        eventType="employee.created"
        fields={[
          ['Department', evt.department],
          ['Title', evt.title],
          ['Start Date', evt.timestamp.split('T')[0]],
        ]}
      />

      {/* Okta User Created */}
      {createUser && (
        <div>
          <SectionLabel>Okta User Created</SectionLabel>
          <ApiCallLine action={createUser} />
          <div className="text-[10px] text-gray-500 font-mono ml-5 mt-0.5">
            {evt.email} &middot; Status: <span className="text-green-400">ACTIVE</span>
          </div>
        </div>
      )}

      {/* Group Assignments */}
      {groups.length > 0 && (
        <div>
          <SectionLabel>Group Assignments ({groups.length})</SectionLabel>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 ml-1">
            {groups.map((g) => (
              <div key={g.details!.group} className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={g.result === 'success' ? 'text-green-400' : 'text-red-400'}>
                  {g.result === 'success' ? '\u2713' : '\u2717'}
                </span>
                <span className="text-gray-400">{g.details!.group}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCIM Provisioning */}
      {apps.length > 0 && (
        <div>
          <SectionLabel>SCIM Provisioning ({apps.length} apps)</SectionLabel>
          <div className="space-y-1.5">
            {apps.map((a, i) => (
              <div key={i}>
                <ApiCallLine action={a} appLabel={a.details?.app} />
                {a.details?.role && (
                  <div className="text-[10px] text-gray-500 font-mono ml-5 mt-0.5">
                    Role: {a.details.role}
                    {a.details.scim_user_id && <span className="text-gray-600"> &middot; {a.details.scim_user_id}</span>}
                  </div>
                )}
                {a.error && (
                  <div className="text-[10px] text-red-400/80 font-mono ml-5 mt-0.5">{a.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ─── MOVER EXPANDED ────────────────────────────────────────────────────────────

function MoverExpanded({ evt, diffAction }: { evt: LifecycleEvent; diffAction: EventEntry | undefined }) {
  const details = diffAction?.details
  const groupsAdd = details?.groups_to_add || []
  const groupsRemove = details?.groups_to_remove || []
  const appsAdd = details?.apps_to_provision || {}
  const appsDel = details?.apps_to_deprovision || []

  const scimOps = evt.actions.filter((a) =>
    (a.action === 'provision_app' || a.action === 'deprovision_app') && a.details?.app
  )
  const groupMutations = evt.actions.filter((a) =>
    (a.action === 'add_group' || a.action === 'remove_group') && a.details?.group
  )
  const added = groupMutations.filter((a) => a.action === 'add_group').length
  const removed = groupMutations.filter((a) => a.action === 'remove_group').length

  return (
    <>
      {/* HRIS Event */}
      <HRISBox
        eventType="employee.updated"
        fields={[
          ...(details?.previous_department ? [['Change', `department ${details.previous_department} \u2192 ${evt.department}`] as [string, string]] : []),
          ...(details?.previous_title ? [['Change', `title ${details.previous_title} \u2192 ${evt.title}`] as [string, string]] : []),
          ['Effective', evt.timestamp.split('T')[0]],
        ]}
      />

      {/* Access Diff */}
      {(groupsAdd.length > 0 || groupsRemove.length > 0 || Object.keys(appsAdd).length > 0 || appsDel.length > 0) && (
        <div>
          <SectionLabel>Access Diff Computed</SectionLabel>
          <div className="bg-black/20 border border-gray-800/40 rounded overflow-hidden">
            <div className="grid grid-cols-2 text-[10px]">
              <div className="px-3 py-2 border-r border-gray-800/40">
                <div className="text-red-400 font-bold uppercase tracking-wider mb-1.5">{'\u2717'} Revoked</div>
                {groupsRemove.length > 0 && (
                  <div className="mb-1">
                    {groupsRemove.map((g) => (
                      <div key={g} className="text-red-300/70 font-mono py-0.5">{g}</div>
                    ))}
                  </div>
                )}
                {appsDel.map((a) => (
                  <div key={a} className="text-red-300/70 font-mono py-0.5">{a} <span className="text-red-400/40">(app)</span></div>
                ))}
                {groupsRemove.length === 0 && appsDel.length === 0 && (
                  <div className="text-gray-700 py-0.5">None</div>
                )}
              </div>
              <div className="px-3 py-2">
                <div className="text-green-400 font-bold uppercase tracking-wider mb-1.5">{'\u2713'} Granted</div>
                {groupsAdd.length > 0 && (
                  <div className="mb-1">
                    {groupsAdd.map((g) => (
                      <div key={g} className="text-green-300/70 font-mono py-0.5">{g}</div>
                    ))}
                  </div>
                )}
                {Object.entries(appsAdd).map(([app, role]) => (
                  <div key={app} className="text-green-300/70 font-mono py-0.5">{app} <span className="text-green-400/50">({role})</span></div>
                ))}
                {groupsAdd.length === 0 && Object.keys(appsAdd).length === 0 && (
                  <div className="text-gray-700 py-0.5">None</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCIM Operations */}
      {scimOps.length > 0 && (
        <div>
          <SectionLabel>SCIM Operations</SectionLabel>
          <div className="space-y-1">
            {scimOps.map((a, i) => (
              <ApiCallLine key={i} action={a} appLabel={a.details?.app} showRole />
            ))}
          </div>
        </div>
      )}

      {/* Group Mutations Summary */}
      {groupMutations.length > 0 && (
        <div className="text-[10px] text-gray-500 font-mono px-1">
          Group Mutations: {removed} removed &middot; {added} added &middot; Net: {added - removed >= 0 ? '+' : ''}{added - removed} group{Math.abs(added - removed) !== 1 ? 's' : ''}
        </div>
      )}
    </>
  )
}

// ─── LEAVER EXPANDED ───────────────────────────────────────────────────────────

function LeaverExpanded({ evt }: { evt: LifecycleEvent }) {
  const disableUser = evt.actions.find((a) => a.action === 'disable_user')
  const revokeSessions = evt.actions.find((a) => a.action === 'revoke_sessions' && a.result === 'success')
  const scimOps = evt.actions.filter((a) => a.action === 'deprovision_app')
  const groupOps = evt.actions.filter((a) => a.action === 'remove_group' && a.details?.group)
  const audits = evt.actions.filter((a) => a.action === 'post_deprovision_audit')

  return (
    <>
      {/* HRIS Event */}
      <HRISBox
        eventType="employee.terminated"
        fields={[
          ['Last Day', evt.timestamp.split('T')[0]],
          ['Processed', evt.timestamp.split('T')[0]],
        ]}
      />

      {/* Okta Deprovisioning */}
      {disableUser && (
        <div>
          <SectionLabel>Okta Deprovisioning</SectionLabel>
          <ApiCallLine action={disableUser} />
          <div className="text-[10px] text-gray-500 font-mono ml-5 mt-0.5">
            Status: <span className="text-gray-400">ACTIVE</span> <span className="text-gray-600">&rarr;</span> <span className="text-red-400">DEPROVISIONED</span>
          </div>
        </div>
      )}

      {/* Session Revocation */}
      {revokeSessions && (
        <div>
          <SectionLabel>Session Revocation</SectionLabel>
          <ApiCallLine action={revokeSessions} />
          <div className="text-[10px] text-gray-500 font-mono ml-5 mt-0.5">
            Active sessions terminated: {revokeSessions.details?.sessions_count || 0}
          </div>
        </div>
      )}

      {/* SCIM Deprovisioning */}
      {scimOps.length > 0 && (
        <div>
          <SectionLabel>SCIM Deprovisioning ({scimOps.length} apps)</SectionLabel>
          <div className="space-y-0.5">
            {scimOps.map((a, i) => (
              <div key={i}>
                <ApiCallLine action={a} appLabel={a.details?.app} />
                {a.error && (
                  <div className="text-[10px] text-red-400/80 font-mono ml-5 mt-0.5">{a.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Removal */}
      {groupOps.length > 0 && (
        <div>
          <SectionLabel>Group Removal ({groupOps.length} groups)</SectionLabel>
          <div className="flex flex-wrap gap-1.5 ml-1">
            {groupOps.map((g) => (
              <span key={g.details!.group} className="text-[10px] font-mono text-red-300/70">
                {'\u2717'} {g.details!.group}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post-Deprovision Audit */}
      {audits.map((audit, ai) => {
        const checks = audit.details?.audit_checks || []
        const isRetry = (audit.details?.retry_count || 0) > 0
        return (
          <div key={ai}>
            <SectionLabel>
              Post-Deprovision Audit{isRetry ? ' (Retry)' : ''} <span className="text-gray-600 font-normal">(15 min)</span>
            </SectionLabel>
            <div className="bg-black/20 border border-gray-800/40 rounded overflow-hidden">
              {checks.map((check, ci) => (
                <div key={ci} className={`flex items-start gap-2 text-[10px] px-3 py-1 ${
                  ci > 0 ? 'border-t border-gray-800/20' : ''
                }`}>
                  <span className={`shrink-0 ${check.result === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                    {check.result === 'pass' ? '\u2713' : '\u2717'}
                  </span>
                  <div>
                    <span className="text-gray-400">{check.check}</span>
                    {check.detail && <div className="text-red-400/60 mt-0.5">{check.detail}</div>}
                  </div>
                </div>
              ))}
              <div className={`border-t border-gray-800/30 px-3 py-1.5 text-[10px] font-bold ${
                audit.result === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                RESULT: {audit.result === 'success' ? 'PASS' : 'FAIL'} — {
                  audit.result === 'success' ? 'all checks verified' : 'action required'
                }
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────────

function HRISBox({ eventType, fields }: { eventType: string; fields: [string, string][] }) {
  return (
    <div className="bg-black/20 border border-gray-800/40 rounded px-3 py-2 text-[11px]">
      <div className="flex items-center gap-2 text-gray-500 font-mono mb-1.5">
        <span>HRIS Event</span>
        <span className="text-gray-700">&middot;</span>
        <span>Source: Sapling</span>
        <span className="text-gray-700">&middot;</span>
        <span className="text-gray-400">{eventType}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {fields.map(([label, value]) => (
          <div key={label + value} className="text-gray-500">
            <span className="text-gray-600">{label}:</span> <span className="text-gray-400">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
      {children}
    </div>
  )
}

function ApiCallLine({ action, appLabel, showRole }: { action: EventEntry; appLabel?: string; showRole?: boolean }) {
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

  const statusText = status ? (
    status === 200 ? '200 OK' :
    status === 201 ? '201 Created' :
    status === 204 ? '204' :
    status === 409 ? '409 Conflict' :
    status === 504 ? '504 Timeout' :
    `${status}`
  ) : ''

  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-mono py-0.5 px-1 rounded ${
      isFail ? 'bg-red-950/20' : isRetry ? 'bg-amber-950/10' : ''
    }`}>
      <span className={`w-3 text-center shrink-0 ${isFail ? 'text-red-400' : isRetry ? 'text-amber-400' : 'text-green-500'}`}>
        {isFail ? '\u2717' : isRetry ? '\u21bb' : '\u2713'}
      </span>
      {appLabel && (
        <span className="text-gray-300 w-16 shrink-0 truncate">{appLabel}</span>
      )}
      {method && <span className={`${methodColor} shrink-0`}>{method}</span>}
      {endpoint && <span className="text-gray-500 truncate flex-1">{endpoint}</span>}
      {status && <span className={`${statusColor} shrink-0`}>&rarr; {statusText}</span>}
      {action.duration_ms != null && <span className="text-gray-600 shrink-0 ml-1">({action.duration_ms}ms)</span>}
      {showRole && action.details?.role && <span className="text-amber-400/60 shrink-0 ml-1">{action.details.role}</span>}
    </div>
  )
}

function formatTime(ts: string): string {
  if (!ts) return ''
  const t = ts.includes('T') ? ts.split('T')[1] : ts
  return t?.slice(0, 5) || ''
}
