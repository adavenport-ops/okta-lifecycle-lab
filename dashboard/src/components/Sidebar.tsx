import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import type { EventEntry, LifecycleEvent } from '../types'

const TYPE_COLORS: Record<string, string> = {
  Join: '#22c55e',
  Move: '#fbbf24',
  Leave: '#ef4444',
  Audit: '#a855f7',
}

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '6px', fontSize: '11px' },
  itemStyle: { color: '#d1d5db' },
  labelStyle: { color: '#9ca3af' },
}

const SCIM_APPS = [
  { name: 'Slack', status: 'Connected' },
  { name: 'GitHub', status: 'Connected' },
  { name: 'Zoom', status: 'Connected' },
  { name: 'Google Workspace', status: 'Connected' },
  { name: 'Figma', status: 'Connected' },
  { name: 'Salesforce', status: 'Connected' },
  { name: 'HubSpot', status: 'Connected' },
  { name: 'Rippling', status: 'Connected' },
  { name: 'NetSuite', status: 'Connected' },
]

const ACTION_SHORT: Record<string, string> = {
  create_user: 'Create user',
  disable_user: 'Disable user',
  revoke_sessions: 'Revoke sessions',
  add_group: 'Add group',
  remove_group: 'Remove group',
  provision_app: 'Provision app',
  deprovision_app: 'Deprovision app',
  compute_diff: 'Compute diff',
  post_deprovision_audit: 'Audit check',
}

interface Props {
  events: EventEntry[]
  lifecycleEvents: LifecycleEvent[]
}

export default function Sidebar({ events, lifecycleEvents }: Props) {
  const typeCounts = lifecycleEvents.reduce<Record<string, number>>((acc, e) => {
    const label = e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))

  const actionCounts = events.reduce<Record<string, number>>((acc, e) => {
    const label = ACTION_SHORT[e.action] || e.action
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Timeline chart: group events by hour
  const timelineData = buildTimeline(lifecycleEvents)

  // Unique departments
  const depts = new Set(lifecycleEvents.map((e) => e.department).filter(Boolean))

  return (
    <div className="space-y-4">
      {/* RBAC Config */}
      <Card title="RBAC Configuration">
        <div className="text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Config file</span>
            <span className="font-mono text-amber-400/80">rbac_rules.yml</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Departments</span>
            <span className="text-gray-300 font-mono">{depts.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role overrides</span>
            <span className="text-gray-300 font-mono">23</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Last updated</span>
            <span className="text-gray-400 font-mono">Mar 18, 2026</span>
          </div>
        </div>
      </Card>

      {/* SCIM Status */}
      <Card title="SCIM Connections">
        <div className="space-y-1">
          {SCIM_APPS.map((app) => (
            <div key={app.name} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-gray-300">{app.name}</span>
              </div>
              <span className="text-gray-600 font-mono">SCIM 2.0</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Events by Type */}
      <Card title="Events by Type">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart margin={{ left: 15, right: 15 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                strokeWidth={0}
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </Card>

      {/* Actions Breakdown */}
      <Card title="Actions Breakdown">
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} layout="vertical" margin={{ left: 5, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2e" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 9 }} />
              <YAxis type="category" dataKey="action" width={80} tick={{ fill: '#6b7280', fontSize: 9 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#fbbf24" radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </Card>

      {/* Provisioning Timeline */}
      {timelineData.length > 1 && (
        <Card title="Processing Timeline">
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={timelineData} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2e" />
              <XAxis dataKey="time" tick={{ fill: '#4b5563', fontSize: 8 }} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 8 }} width={30} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="events" stroke="#fbbf24" strokeWidth={1.5} dot={{ fill: '#fbbf24', r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#131620] border border-gray-800/50 rounded-lg p-3">
      <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function Empty() {
  return <p className="text-gray-600 text-[10px] text-center py-6">No data</p>
}

function buildTimeline(events: LifecycleEvent[]): { time: string; events: number }[] {
  const byDate = new Map<string, number>()
  for (const e of events) {
    const date = e.timestamp.split('T')[0]?.slice(5) || '' // "03-18"
    byDate.set(date, (byDate.get(date) || 0) + 1)
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({ time, events: count }))
}
