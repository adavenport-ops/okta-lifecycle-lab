import type { Employee, EventEntry } from '../types'

interface Props {
  employee: Employee | null
  events: EventEntry[]
  onClose: () => void
}

export default function UserCard({ employee, events, onClose }: Props) {
  if (!employee) return null

  const userEvents = events.filter((e) => e.employee_id === employee.employee_id)
  const groups = extractGroups(userEvents)
  const apps = extractApps(userEvents)
  const isTerminated = employee.status === 'terminated'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-sm text-gray-400">{employee.title} &middot; {employee.department}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{employee.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              isTerminated
                ? 'bg-red-950/50 text-red-400 border border-red-900/40'
                : 'bg-green-950/50 text-green-400 border border-green-900/40'
            }`}>
              {employee.status}
            </span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Employee details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Employee ID" value={employee.employee_id} />
            <Detail label="Start Date" value={employee.start_date} />
            {employee.end_date && <Detail label="End Date" value={employee.end_date} />}
            {employee.manager_email && <Detail label="Manager" value={employee.manager_email} />}
          </div>

          {/* Okta Groups */}
          <Section title="Okta Groups" count={groups.length}>
            {groups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <span key={g} className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[11px] font-mono border border-gray-700">
                    {g}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-xs">No groups assigned</p>
            )}
          </Section>

          {/* App Assignments */}
          <Section title="App Assignments" count={Object.keys(apps).length}>
            {Object.keys(apps).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(apps).map(([app, role]) => (
                  <div key={app} className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded px-2.5 py-1.5">
                    <span className="text-[11px] font-mono text-gray-300">{app}</span>
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider">{role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-xs">No apps provisioned</p>
            )}
          </Section>

          {/* Event History */}
          <Section title="Provisioning History" count={userEvents.length}>
            {userEvents.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {[...userEvents].reverse().map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] py-1">
                    <span className="font-mono text-gray-600 w-16 shrink-0">{formatTime(e.timestamp)}</span>
                    <TypeBadge type={e.event_type} />
                    <span className="text-gray-400 truncate">{e.action}</span>
                    {e.details?.group && <span className="text-gray-500 font-mono">{e.details.group}</span>}
                    {e.details?.app && <span className="text-gray-500 font-mono">{e.details.app}</span>}
                    <span className={`ml-auto shrink-0 ${e.result === 'failure' ? 'text-red-400' : 'text-green-500'}`}>
                      {e.result === 'failure' ? '\u2717' : '\u2713'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-xs">No events</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-gray-300 font-mono text-xs">{value}</p>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs uppercase tracking-wider text-gray-500">{title}</h3>
        <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    join: 'text-green-400 bg-green-950/40',
    move: 'text-amber-400 bg-amber-950/30',
    leave: 'text-red-400 bg-red-950/30',
    audit: 'text-purple-400 bg-purple-950/30',
  }
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${colors[type] || 'text-gray-400 bg-gray-800'}`}>
      {type}
    </span>
  )
}

function formatTime(ts: string): string {
  if (!ts) return ''
  const t = ts.includes('T') ? ts.split('T')[1] : ts
  return t?.slice(0, 8) || ''
}

/** Reconstruct current groups from event log (adds minus removes). */
function extractGroups(events: EventEntry[]): string[] {
  const groups = new Set<string>()
  for (const e of events) {
    if (e.action === 'add_group' && e.details?.group && e.result !== 'failure') {
      groups.add(e.details.group)
    }
    if (e.action === 'remove_group' && e.details?.group && e.result !== 'failure') {
      groups.delete(e.details.group)
    }
  }
  return [...groups].sort()
}

/** Reconstruct current app assignments from event log. */
function extractApps(events: EventEntry[]): Record<string, string> {
  const apps: Record<string, string> = {}
  for (const e of events) {
    if (e.action === 'provision_app' && e.details?.app && e.result !== 'failure') {
      apps[e.details.app] = e.details.role || 'unknown'
    }
    if (e.action === 'deprovision_app' && e.details?.app && e.result !== 'failure') {
      delete apps[e.details.app]
    }
  }
  return apps
}
