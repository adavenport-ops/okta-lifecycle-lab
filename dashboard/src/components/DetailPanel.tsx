import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { LifecycleEvent, EventEntry, Employee } from '../types'

interface Props {
  event: LifecycleEvent | null
  employees: Employee[]
}

export default function DetailPanel({ event, employees }: Props) {
  const [showJson, setShowJson] = useState(false)

  if (!event) {
    return (
      <div className="bg-[#131620] border border-gray-800/50 rounded-lg p-6 text-center text-gray-600 text-sm h-full flex items-center justify-center">
        Select an event to view details
      </div>
    )
  }

  const emp = employees.find((e) => e.employee_id === event.employee_id)
  const diffAction = event.actions.find((a) => a.action === 'compute_diff')
  const totalMs = event.actions.reduce((s, a) => s + (a.duration_ms || 0), 0)
  const isTerminated = emp?.status === 'terminated'
  const oktaId = event.actions.find((a) => a.details?.okta_user_id)?.details?.okta_user_id

  return (
    <div className="bg-[#131620] border border-gray-800/50 rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/50 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">
            {event.event_type === 'move' ? 'Access Diff' :
             event.event_type === 'leave' ? 'Deprovision Record' : 'Provision Record'}
          </h3>
          <span className="text-[10px] text-gray-600 font-mono">{totalMs.toFixed(0)}ms total</span>
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-4">
        {/* Employee profile card */}
        <div className="bg-black/20 border border-gray-800/40 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-200">{event.employee_name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{event.title} &middot; {event.department}</div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">{event.email}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isTerminated
                  ? 'bg-red-950/50 text-red-400 border border-red-900/40'
                  : 'bg-green-950/50 text-green-400 border border-green-900/40'
              }`}>
                {isTerminated ? 'Deprovisioned' : 'Active'}
              </span>
              {oktaId && <span className="text-[9px] text-gray-600 font-mono">{oktaId}</span>}
            </div>
          </div>
          {emp && (
            <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-gray-800/30 text-[10px]">
              <div><span className="text-gray-600">ID:</span> <span className="text-gray-400 font-mono">{emp.employee_id}</span></div>
              <div><span className="text-gray-600">Start:</span> <span className="text-gray-400 font-mono">{emp.start_date}</span></div>
              {emp.manager_email && <div className="col-span-2"><span className="text-gray-600">Manager:</span> <span className="text-gray-400 font-mono">{emp.manager_email}</span></div>}
              {emp.end_date && <div><span className="text-gray-600">End:</span> <span className="text-gray-400 font-mono">{emp.end_date}</span></div>}
            </div>
          )}
        </div>

        {/* Type-specific content */}
        {event.event_type === 'join' && <JoinDetail event={event} />}
        {event.event_type === 'move' && diffAction?.details && <MoveDetail event={event} details={diffAction.details} />}
        {event.event_type === 'leave' && <LeaveDetail event={event} />}

        {/* API call log */}
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">API Call Log</h4>
          <div className="bg-black/20 border border-gray-800/40 rounded-lg overflow-hidden">
            {event.actions.map((action, i) => (
              <div key={i} className={`flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 ${
                i > 0 ? 'border-t border-gray-800/20' : ''
              } ${action.result === 'failure' ? 'bg-red-950/10' : ''}`}>
                <span className={`w-3 shrink-0 text-center ${
                  action.result === 'failure' ? 'text-red-400' : 'text-green-500'
                }`}>
                  {action.result === 'failure' ? '\u2717' : '\u2713'}
                </span>
                <span className={`w-12 shrink-0 ${
                  action.details?.http_method === 'POST' ? 'text-green-400' :
                  action.details?.http_method === 'DELETE' ? 'text-red-400' :
                  action.details?.http_method === 'PUT' || action.details?.http_method === 'PATCH' ? 'text-amber-400' :
                  'text-gray-500'
                }`}>
                  {action.details?.http_method || action.action.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-500 truncate flex-1">
                  {action.details?.http_endpoint || `${action.details?.group || action.details?.app || ''}`}
                </span>
                {action.details?.http_status && (
                  <span className={`shrink-0 ${action.details.http_status >= 400 ? 'text-red-400' : 'text-green-500'}`}>
                    {action.details.http_status}
                  </span>
                )}
                {action.duration_ms != null && (
                  <span className="text-gray-600 shrink-0 w-12 text-right">{action.duration_ms}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Raw JSON toggle */}
        <div>
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-400 transition-colors"
          >
            {showJson ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Raw Event Data
          </button>
          {showJson && (
            <pre className="mt-2 bg-black/30 border border-gray-800/40 rounded-lg p-3 text-[9px] text-gray-500 font-mono overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(event, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function JoinDetail({ event }: { event: LifecycleEvent }) {
  const groups = event.actions.filter((a) => a.action === 'add_group' && a.details?.group).map((a) => a.details!.group!)
  const apps = event.actions.filter((a) => a.action === 'provision_app' && a.details?.app)
    .map((a) => ({ app: a.details!.app!, role: a.details?.role || '', scimId: a.details?.scim_user_id }))

  return (
    <>
      {groups.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Group Assignments ({groups.length})</h4>
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <span key={g} className="bg-green-950/30 border border-green-900/30 text-green-300/80 px-2 py-0.5 rounded font-mono text-[10px]">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
      {apps.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">SCIM Provisioning ({apps.length} apps)</h4>
          <div className="space-y-1">
            {apps.map(({ app, role, scimId }) => (
              <div key={app} className="flex items-center justify-between bg-green-950/15 border border-green-900/20 rounded px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-[10px]">{'\u2713'}</span>
                  <span className="text-[11px] font-mono text-gray-300">{app}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-400/80 uppercase">{role}</span>
                  {scimId && <span className="text-[9px] text-gray-600 font-mono">{scimId}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function MoveDetail({ event, details }: { event: LifecycleEvent; details: NonNullable<EventEntry['details']> }) {
  const groupsAdd = details.groups_to_add || []
  const groupsRemove = details.groups_to_remove || []
  const appsAdd = details.apps_to_provision || {}
  const appsDel = details.apps_to_deprovision || []

  return (
    <>
      {/* Transition header */}
      {details.previous_department && (
        <div className="text-[11px] text-gray-400">
          <span className="text-red-400/80">{details.previous_department} / {details.previous_title}</span>
          <span className="text-gray-600 mx-2">&rarr;</span>
          <span className="text-green-400/80">{event.department} / {event.title}</span>
        </div>
      )}

      {/* Side-by-side diff */}
      <div className="bg-black/20 border border-gray-800/40 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="px-3 py-2.5 border-r border-gray-800/40">
            <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-2">Revoked</div>
            {groupsRemove.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Groups</div>
                {groupsRemove.map((g) => (
                  <div key={g} className="flex items-center gap-1.5 py-0.5">
                    <span className="text-red-400/60 text-[10px]">{'\u2717'}</span>
                    <span className="text-red-300/60 font-mono text-[10px]">{g}</span>
                  </div>
                ))}
              </div>
            )}
            {appsDel.length > 0 && (
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Apps</div>
                {appsDel.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 py-0.5">
                    <span className="text-red-400/60 text-[10px]">{'\u2717'}</span>
                    <span className="text-red-300/60 font-mono text-[10px]">{a}</span>
                  </div>
                ))}
              </div>
            )}
            {groupsRemove.length === 0 && appsDel.length === 0 && (
              <div className="text-gray-700 text-[10px]">No changes</div>
            )}
          </div>
          <div className="px-3 py-2.5">
            <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-2">Granted</div>
            {groupsAdd.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Groups</div>
                {groupsAdd.map((g) => (
                  <div key={g} className="flex items-center gap-1.5 py-0.5">
                    <span className="text-green-400/60 text-[10px]">{'\u2713'}</span>
                    <span className="text-green-300/60 font-mono text-[10px]">{g}</span>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(appsAdd).length > 0 && (
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Apps</div>
                {Object.entries(appsAdd).map(([app, role]) => (
                  <div key={app} className="flex items-center gap-1.5 py-0.5">
                    <span className="text-green-400/60 text-[10px]">{'\u2713'}</span>
                    <span className="text-green-300/60 font-mono text-[10px]">{app} <span className="text-green-500/50">({role})</span></span>
                  </div>
                ))}
              </div>
            )}
            {groupsAdd.length === 0 && Object.keys(appsAdd).length === 0 && (
              <div className="text-gray-700 text-[10px]">No changes</div>
            )}
          </div>
        </div>
        {/* Summary */}
        <div className="border-t border-gray-800/40 px-3 py-1.5 text-[10px] text-gray-500">
          {groupsRemove.length + appsDel.length} revoked &middot; {groupsAdd.length + Object.keys(appsAdd).length} granted
        </div>
      </div>
    </>
  )
}

function LeaveDetail({ event }: { event: LifecycleEvent }) {
  const disabled = event.actions.find((a) => a.action === 'disable_user' && a.result === 'success')
  const sessions = event.actions.find((a) => a.action === 'revoke_sessions' && a.result === 'success')
  const apps = event.actions.filter((a) => a.action === 'deprovision_app').map((a) => ({
    app: a.details?.app || '',
    ok: a.result === 'success',
    scimId: a.details?.scim_user_id,
  }))
  const groups = event.actions.filter((a) => a.action === 'remove_group').map((a) => a.details?.group || '')
  const audit = event.actions.find((a) => a.action === 'post_deprovision_audit')
  const auditChecks = audit?.details?.audit_checks || []

  return (
    <>
      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5">
        <Pill ok={!!disabled} label="Okta Disabled" />
        <Pill ok={!!sessions} label={`Sessions Revoked${sessions?.details?.sessions_count ? ` (${sessions.details.sessions_count})` : ''}`} />
      </div>

      {/* Deprovisioned apps */}
      {apps.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">SCIM Deprovisioning ({apps.length} apps)</h4>
          <div className="space-y-1">
            {apps.map(({ app, ok, scimId }) => (
              <div key={app} className="flex items-center justify-between bg-red-950/15 border border-red-900/20 rounded px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${ok ? 'text-green-400' : 'text-red-400'}`}>{ok ? '\u2713' : '\u2717'}</span>
                  <span className="text-[11px] font-mono text-gray-300">{app}</span>
                </div>
                {scimId && <span className="text-[9px] text-gray-600 font-mono">{scimId}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups removed */}
      {groups.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Groups Removed ({groups.length})</h4>
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <span key={g} className="bg-red-950/30 border border-red-900/30 text-red-300/70 px-2 py-0.5 rounded font-mono text-[10px]">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Audit results */}
      {auditChecks.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
            Post-Deprovision Audit
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${
              audit?.result === 'success' ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'
            }`}>
              {audit?.result === 'success' ? 'PASS' : 'FAIL'}
            </span>
          </h4>
          <div className="bg-black/20 border border-gray-800/40 rounded-lg overflow-hidden">
            {auditChecks.map((check, i) => (
              <div key={i} className={`flex items-start gap-2 text-[10px] px-3 py-1.5 ${
                i > 0 ? 'border-t border-gray-800/20' : ''
              }`}>
                <span className={`shrink-0 ${check.result === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                  {check.result === 'pass' ? '\u2713' : '\u2717'}
                </span>
                <div>
                  <span className="text-gray-400">{check.check}</span>
                  {check.detail && <div className="text-gray-600 mt-0.5">{check.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
      ok ? 'bg-green-950/30 text-green-400 border border-green-900/30' : 'bg-red-950/30 text-red-400 border border-red-900/30'
    }`}>
      {ok ? '\u2713' : '\u2717'} {label}
    </span>
  )
}
