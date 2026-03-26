import { useMemo, useState } from 'react'
import { useSSE, useEmployees, groupEvents } from './hooks'
import KPICards from './components/KPICards'
import EventTimeline from './components/EventTimeline'
import AccessDiffView from './components/AccessDiffView'
import AuditCharts from './components/AuditCharts'
import UserCard from './components/UserCard'
import type { LifecycleEvent } from './types'

export default function App() {
  const { events, connected, demoMode } = useSSE()
  const employees = useEmployees(demoMode)
  const lifecycleEvents = useMemo(() => groupEvents(events), [events])

  const [selectedEvent, setSelectedEvent] = useState<LifecycleEvent | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const selectedEmployee = selectedUserId
    ? employees.find((e) => e.employee_id === selectedUserId) || null
    : null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-950/90 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h1 className="text-sm font-semibold tracking-wide">Okta Lifecycle Lab</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-gray-500 font-mono hidden sm:inline">
              {lifecycleEvents.length} lifecycle events &middot; {events.length} actions
            </span>
            <div className="flex items-center gap-1.5">
              {demoMode ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-semibold tracking-wide border border-amber-400/20">
                  Demo · Static Data
                </span>
              ) : (
                <>
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-[11px] text-gray-500">{connected ? 'Live' : 'Disconnected'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI row */}
        <KPICards events={events} lifecycleEvents={lifecycleEvents} />

        {/* Main content: timeline + detail panel */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Timeline (wider) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs uppercase tracking-wider text-gray-500">Event Timeline</h2>
              <FilterPills events={lifecycleEvents} />
            </div>
            <EventTimeline
              events={lifecycleEvents}
              onSelectEvent={setSelectedEvent}
              onSelectUser={setSelectedUserId}
              selectedEventId={selectedEvent?.event_id || null}
            />
          </div>

          {/* Right panel: diff + charts */}
          <div className="lg:col-span-2 space-y-4">
            <AccessDiffView event={selectedEvent} />
            <AuditCharts events={events} lifecycleEvents={lifecycleEvents} />
          </div>
        </div>
      </main>

      {/* User card modal */}
      {selectedEmployee && (
        <UserCard
          employee={selectedEmployee}
          events={events}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}

/** Lightweight filter pills showing count by type */
function FilterPills({ events }: { events: LifecycleEvent[] }) {
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1
    return acc
  }, {})

  const types = [
    { key: 'join', label: 'J', color: 'text-green-400' },
    { key: 'move', label: 'M', color: 'text-amber-400' },
    { key: 'leave', label: 'L', color: 'text-red-400' },
  ] as const

  return (
    <div className="flex items-center gap-2">
      {types.map(({ key, label, color }) => (
        <span key={key} className="flex items-center gap-1">
          <span className={`text-[10px] font-bold ${color}`}>{label}</span>
          <span className="text-[10px] text-gray-600 font-mono">{counts[key] || 0}</span>
        </span>
      ))}
    </div>
  )
}
