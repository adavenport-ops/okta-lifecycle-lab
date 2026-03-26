import type { EventEntry, LifecycleEvent } from '../types'

interface Props {
  events: EventEntry[]
  lifecycleEvents: LifecycleEvent[]
}

function kpi(events: EventEntry[], lifecycleEvents: LifecycleEvent[]) {
  const totalEvents = lifecycleEvents.length
  const errorEvents = events.filter((e) => e.result === 'failure')
  const errorRate = totalEvents > 0 ? (errorEvents.length / events.length) * 100 : 0

  // Avg provision time: sum of duration_ms on provision_app actions
  const provisionActions = events.filter((e) => e.action === 'provision_app' && e.duration_ms)
  const avgProvisionMs =
    provisionActions.length > 0
      ? provisionActions.reduce((s, e) => s + (e.duration_ms || 0), 0) / provisionActions.length
      : 0

  // Avg deprovision time: sum of duration_ms on deprovision actions or leave events
  const deprovisionActions = events.filter(
    (e) => (e.action === 'deprovision_app' || e.action === 'disable_user') && e.duration_ms,
  )
  const avgDeprovisionMs =
    deprovisionActions.length > 0
      ? deprovisionActions.reduce((s, e) => s + (e.duration_ms || 0), 0) / deprovisionActions.length
      : 0

  // Orphaned accounts: audit failures
  const auditFailures = events.filter(
    (e) => e.action === 'post_deprovision_audit' && e.result === 'fail',
  )

  return { totalEvents, errorRate, avgProvisionMs, avgDeprovisionMs, orphanedCount: auditFailures.length }
}

export default function KPICards({ events, lifecycleEvents }: Props) {
  const { totalEvents, errorRate, avgProvisionMs, avgDeprovisionMs, orphanedCount } = kpi(events, lifecycleEvents)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Card label="Events Processed" value={String(totalEvents)} />
      <Card
        label="Avg Provision"
        value={avgProvisionMs > 0 ? `${avgProvisionMs.toFixed(0)}ms` : '--'}
        sub={avgProvisionMs > 0 && avgProvisionMs < 900000 ? 'On target' : undefined}
        subColor={avgProvisionMs < 900000 ? 'text-green-400' : 'text-red-400'}
      />
      <Card
        label="Avg Deprovision"
        value={avgDeprovisionMs > 0 ? `${avgDeprovisionMs.toFixed(0)}ms` : '--'}
        sub={avgDeprovisionMs > 0 && avgDeprovisionMs < 300000 ? 'On target' : undefined}
        subColor={avgDeprovisionMs < 300000 ? 'text-green-400' : 'text-red-400'}
      />
      <Card
        label="Error Rate"
        value={`${errorRate.toFixed(1)}%`}
        subColor={errorRate === 0 ? 'text-green-400' : 'text-amber-400'}
        sub={errorRate === 0 ? 'Clean' : 'Needs review'}
      />
      <Card
        label="Orphaned Accounts"
        value={String(orphanedCount)}
        subColor={orphanedCount === 0 ? 'text-green-400' : 'text-red-400'}
        sub={orphanedCount === 0 ? 'None' : 'Action needed'}
      />
    </div>
  )
}

function Card({
  label,
  value,
  sub,
  subColor = 'text-gray-500',
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-4">
      <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-amber-400 font-mono">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}
