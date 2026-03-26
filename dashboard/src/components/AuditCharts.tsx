import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { EventEntry, LifecycleEvent } from '../types'

const TYPE_COLORS: Record<string, string> = {
  join: '#22c55e',
  move: '#fbbf24',
  leave: '#ef4444',
  audit: '#a855f7',
}

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' },
  itemStyle: { color: '#d1d5db' },
  labelStyle: { color: '#9ca3af' },
}

interface Props {
  events: EventEntry[]
  lifecycleEvents: LifecycleEvent[]
}

export default function AuditCharts({ events, lifecycleEvents }: Props) {
  const typeCounts = lifecycleEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1
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

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Events by Type</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                strokeWidth={0}
                label={({ name, value }) => `${name} (${value})`}
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
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Actions Breakdown</h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis type="category" dataKey="action" width={90} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-gray-600 text-sm text-center py-12">No data</p>
}

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
