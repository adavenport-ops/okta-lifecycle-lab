import type { EventEntry, LifecycleEvent } from '../types'

interface Props {
  events: EventEntry[]
  lifecycleEvents: LifecycleEvent[]
}

function kpi(events: EventEntry[], lifecycleEvents: LifecycleEvent[]) {
  const totalEvents = lifecycleEvents.length
  const errorEvents = events.filter((e) => e.result === 'failure')
  const errorRate = totalEvents > 0 ? (errorEvents.length / events.length) * 100 : 0

  const joinCount = lifecycleEvents.filter((e) => e.event_type === 'join').length
  const moveCount = lifecycleEvents.filter((e) => e.event_type === 'move').length
  const leaveCount = lifecycleEvents.filter((e) => e.event_type === 'leave').length

  const provisionActions = events.filter((e) => e.action === 'provision_app' && e.duration_ms && e.result === 'success')
  const avgProvisionMs =
    provisionActions.length > 0
      ? provisionActions.reduce((s, e) => s + (e.duration_ms || 0), 0) / provisionActions.length
      : 0

  const deprovisionActions = events.filter(
    (e) => (e.action === 'deprovision_app' || e.action === 'disable_user') && e.duration_ms && e.result === 'success',
  )
  const avgDeprovisionMs =
    deprovisionActions.length > 0
      ? deprovisionActions.reduce((s, e) => s + (e.duration_ms || 0), 0) / deprovisionActions.length
      : 0

  const auditFailures = events.filter(
    (e) => e.action === 'post_deprovision_audit' && e.result === 'failure',
  )

  return { totalEvents, joinCount, moveCount, leaveCount, errorRate, avgProvisionMs, avgDeprovisionMs, orphanedCount: auditFailures.length }
}

export default function KPICards({ events, lifecycleEvents }: Props) {
  const { totalEvents, joinCount, moveCount, leaveCount, errorRate, avgProvisionMs, avgDeprovisionMs, orphanedCount } = kpi(events, lifecycleEvents)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="bg-[#131620] border border-gray-800/50 rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Events Processed</p>
        <p className="text-2xl font-semibold text-amber-400 font-mono">{totalEvents}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <MiniBar label="J" count={joinCount} max={totalEvents} color="bg-green-500" />
          <MiniBar label="M" count={moveCount} max={totalEvents} color="bg-amber-500" />
          <MiniBar label="L" count={leaveCount} max={totalEvents} color="bg-red-500" />
        </div>
      </div>

      <Card
        label="Avg Provision"
        value={avgProvisionMs > 0 ? `${avgProvisionMs.toFixed(0)}ms` : '--'}
        sub={avgProvisionMs > 0 ? '< 15 min target' : undefined}
        subColor={avgProvisionMs > 0 && avgProvisionMs < 900000 ? 'text-green-400' : 'text-gray-600'}
        dot={avgProvisionMs > 0 && avgProvisionMs < 900000}
      />
      <Card
        label="Avg Deprovision"
        value={avgDeprovisionMs > 0 ? `${avgDeprovisionMs.toFixed(0)}ms` : '--'}
        sub={avgDeprovisionMs > 0 ? '< 5 min target' : undefined}
        subColor={avgDeprovisionMs > 0 && avgDeprovisionMs < 300000 ? 'text-green-400' : 'text-gray-600'}
        dot={avgDeprovisionMs > 0 && avgDeprovisionMs < 300000}
      />
      <Card
        label="Error Rate"
        value={`${errorRate.toFixed(1)}%`}
        sub={errorRate === 0 ? 'Clean' : 'Needs review'}
        subColor={errorRate === 0 ? 'text-green-400' : 'text-amber-400'}
        dot={errorRate === 0}
      />
      <Card
        label="Orphaned Accounts"
        value={String(orphanedCount)}
        sub={orphanedCount === 0 ? 'None detected' : 'Action needed'}
        subColor={orphanedCount === 0 ? 'text-green-400' : 'text-red-400'}
        dot={orphanedCount === 0}
      />
    </div>
  )
}

function Card({
  label,
  value,
  sub,
  subColor = 'text-gray-500',
  dot,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
  dot?: boolean
}) {
  return (
    <div className="bg-[#131620] border border-gray-800/50 rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-amber-400 font-mono">{value}</p>
      {sub && (
        <div className="flex items-center gap-1.5 mt-1">
          {dot != null && <span className={`w-1.5 h-1.5 rounded-full ${dot ? 'bg-green-500' : 'bg-amber-500'}`} />}
          <p className={`text-[10px] ${subColor}`}>{sub}</p>
        </div>
      )}
    </div>
  )
}

function MiniBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-1 flex-1">
      <span className="text-[9px] font-bold text-gray-500 w-3">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-gray-600 font-mono w-4 text-right">{count}</span>
    </div>
  )
}
