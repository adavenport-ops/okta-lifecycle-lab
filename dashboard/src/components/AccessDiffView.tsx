import type { LifecycleEvent } from '../types'

interface Props {
  event: LifecycleEvent | null
}

export default function AccessDiffView({ event }: Props) {
  if (!event) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-6 text-center text-gray-600 text-sm">
        Select an event to view details
      </div>
    )
  }

  const diffAction = event.actions.find((a) => a.action === 'compute_diff')
  const isMove = event.event_type === 'move' && diffAction?.details
  const isLeave = event.event_type === 'leave'
  const isJoin = event.event_type === 'join'
  const totalMs = event.actions.reduce((s, a) => s + (a.duration_ms || 0), 0)

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-lg overflow-hidden max-h-[600px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-gray-300">
          {isMove ? 'Access Diff' : isLeave ? 'Deprovisioned Access' : 'Provisioned Access'}
        </h3>
        <span className="text-xs text-gray-500 font-mono">{event.employee_name} / {event.employee_id}</span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Employee info + timing */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{event.department}{event.title ? ` · ${event.title}` : ''}</span>
          <span className="font-mono">
            {totalMs > 0 ? `${totalMs.toFixed(0)}ms` : ''}{' '}
            {event.timestamp ? formatTs(event.timestamp) : ''}
          </span>
        </div>

        {isMove && diffAction?.details && <MoveDiff details={diffAction.details} />}
        {isJoin && <JoinView event={event} />}
        {isLeave && <LeaveView event={event} />}
      </div>
    </div>
  )
}

function MoveDiff({ details }: { details: NonNullable<LifecycleEvent['actions'][0]['details']> }) {
  const groupsAdd = details.groups_to_add || []
  const groupsRemove = details.groups_to_remove || []
  const appsProvision = details.apps_to_provision || {}
  const appsDeprovision = details.apps_to_deprovision || []

  return (
    <>
      {/* Groups diff */}
      {(groupsAdd.length > 0 || groupsRemove.length > 0) && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Groups</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-red-500 uppercase tracking-wider mb-1">Removed</p>
              {groupsRemove.length > 0 ? (
                <div className="space-y-1">
                  {groupsRemove.map((g) => (
                    <div key={g} className="flex items-center gap-1.5 text-xs">
                      <span className="text-red-400 font-mono">-</span>
                      <span className="bg-red-950/40 border border-red-900/40 text-red-300 px-2 py-0.5 rounded font-mono text-[11px]">{g}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-xs">None</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-green-500 uppercase tracking-wider mb-1">Added</p>
              {groupsAdd.length > 0 ? (
                <div className="space-y-1">
                  {groupsAdd.map((g) => (
                    <div key={g} className="flex items-center gap-1.5 text-xs">
                      <span className="text-green-400 font-mono">+</span>
                      <span className="bg-green-950/40 border border-green-900/40 text-green-300 px-2 py-0.5 rounded font-mono text-[11px]">{g}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-xs">None</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apps diff */}
      {(Object.keys(appsProvision).length > 0 || appsDeprovision.length > 0) && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Applications</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-red-500 uppercase tracking-wider mb-1">Deprovisioned</p>
              {appsDeprovision.length > 0 ? (
                <div className="space-y-1">
                  {appsDeprovision.map((a) => (
                    <div key={a} className="flex items-center gap-1.5 text-xs">
                      <span className="text-red-400 font-mono">-</span>
                      <span className="bg-red-950/40 border border-red-900/40 text-red-300 px-2 py-0.5 rounded font-mono text-[11px]">{a}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-xs">None</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-green-500 uppercase tracking-wider mb-1">Provisioned</p>
              {Object.keys(appsProvision).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(appsProvision).map(([app, role]) => (
                    <div key={app} className="flex items-center gap-1.5 text-xs">
                      <span className="text-green-400 font-mono">+</span>
                      <span className="bg-green-950/40 border border-green-900/40 text-green-300 px-2 py-0.5 rounded font-mono text-[11px]">
                        {app} <span className="text-green-500">({role})</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-xs">None</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function JoinView({ event }: { event: LifecycleEvent }) {
  const groups = event.actions.filter((a) => a.action === 'add_group').map((a) => a.details?.group).filter(Boolean) as string[]
  const apps = event.actions
    .filter((a) => a.action === 'provision_app' && a.details?.app)
    .map((a) => ({ app: a.details!.app!, role: a.details?.role || '' }))

  return (
    <>
      {groups.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Groups Assigned</h4>
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <span key={g} className="bg-green-950/40 border border-green-900/40 text-green-300 px-2 py-0.5 rounded font-mono text-[11px]">
                + {g}
              </span>
            ))}
          </div>
        </div>
      )}
      {apps.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Apps Provisioned</h4>
          <div className="flex flex-wrap gap-1">
            {apps.map(({ app, role }) => (
              <span key={app} className="bg-green-950/40 border border-green-900/40 text-green-300 px-2 py-0.5 rounded font-mono text-[11px]">
                + {app} <span className="text-green-500">({role})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function LeaveView({ event }: { event: LifecycleEvent }) {
  const groups = event.actions.filter((a) => a.action === 'remove_group').map((a) => a.details?.group).filter(Boolean) as string[]
  const apps = event.actions.filter((a) => a.action === 'deprovision_app').map((a) => a.details?.app).filter(Boolean) as string[]
  const disabled = event.actions.some((a) => a.action === 'disable_user' && a.result === 'success')
  const sessions = event.actions.some((a) => a.action === 'revoke_sessions' && a.result === 'success')
  const auditPassed = event.actions.some((a) => a.action === 'post_deprovision_audit' && a.result === 'success')

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <StatusPill ok={disabled} label="Okta Disabled" />
        <StatusPill ok={sessions} label="Sessions Revoked" />
        <StatusPill ok={auditPassed} label="Audit Passed" />
      </div>
      {groups.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Groups Removed</h4>
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <span key={g} className="bg-red-950/40 border border-red-900/40 text-red-300 px-2 py-0.5 rounded font-mono text-[11px]">
                - {g}
              </span>
            ))}
          </div>
        </div>
      )}
      {apps.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Apps Deprovisioned</h4>
          <div className="flex flex-wrap gap-1">
            {apps.map((a) => (
              <span key={a} className="bg-red-950/40 border border-red-900/40 text-red-300 px-2 py-0.5 rounded font-mono text-[11px]">
                - {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function formatTs(ts: string): string {
  if (!ts) return ''
  const t = ts.includes('T') ? ts.split('T')[1] : ts
  return t?.slice(0, 8) || ''
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
      ok ? 'bg-green-950/40 text-green-400 border border-green-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
    }`}>
      {ok ? '\u2713' : '\u2717'} {label}
    </span>
  )
}
