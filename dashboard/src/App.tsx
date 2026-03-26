import { useMemo, useState } from 'react'
import { useSSE, useEmployees, groupEvents } from './hooks'
import Pipeline from './components/Pipeline'
import KPICards from './components/KPICards'
import EventTimeline from './components/EventTimeline'
import DetailPanel from './components/DetailPanel'
import Sidebar from './components/Sidebar'
import UserCard from './components/UserCard'
import type { LifecycleEvent } from './types'

export default function App() {
  const { events, connected, demoMode } = useSSE()
  const employees = useEmployees(demoMode)
  const lifecycleEvents = useMemo(() => groupEvents(events), [events])

  const [selectedEvent, setSelectedEvent] = useState<LifecycleEvent | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const selectedEmployee = selectedUserId
    ? employees.find((e) => e.employee_id === selectedUserId) || null
    : null

  const depts = new Set(lifecycleEvents.map((e) => e.department).filter(Boolean))

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-800/50 bg-[#0f1117]/90 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h1 className="text-sm font-semibold tracking-wide">Okta Lifecycle Lab</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-500 font-mono hidden md:inline">
              {lifecycleEvents.length} lifecycle events &middot; {events.length} actions &middot; {depts.size} departments
            </span>
            {demoMode ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-semibold tracking-wide border border-amber-400/20">
                Demo &middot; Static Data
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-500">{connected ? 'Live' : 'Disconnected'}</span>
              </div>
            )}
          </div>
        </div>
        {/* Pipeline visualization */}
        <div className="border-t border-gray-800/30 bg-[#0c0e14]">
          <div className="max-w-[1600px] mx-auto">
            <Pipeline />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* KPI row */}
        <KPICards events={events} lifecycleEvents={lifecycleEvents} />

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Event Timeline */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-wider text-gray-500">Event Timeline</h2>
              <FilterPills events={lifecycleEvents} filter={typeFilter} setFilter={setTypeFilter} />
            </div>
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              <EventTimeline
                events={lifecycleEvents}
                onSelectEvent={setSelectedEvent}
                onSelectUser={setSelectedUserId}
                selectedEventId={selectedEvent?.event_id || null}
                filter={typeFilter}
              />
            </div>
          </div>

          {/* Middle: Detail Panel */}
          <div className="lg:col-span-3 xl:col-span-3">
            <h2 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Detail View</h2>
            <DetailPanel event={selectedEvent} employees={employees} />
          </div>

          {/* Right: Analytics Sidebar */}
          <div className="lg:col-span-3 xl:col-span-2">
            <h2 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">System Status</h2>
            <Sidebar events={events} lifecycleEvents={lifecycleEvents} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/30 mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[10px] text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
            <span>Okta Lifecycle Lab &middot; Built by Alex Davenport</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://alexdavenport.dev" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">alexdavenport.dev</a>
            <a href="https://github.com/adavenport-ops/okta-lifecycle-lab" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">GitHub</a>
            <span className="text-gray-700">HRIS &rarr; Okta Workflows &rarr; SCIM</span>
          </div>
        </div>
      </footer>

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

function FilterPills({ events, filter, setFilter }: { events: LifecycleEvent[]; filter: string | null; setFilter: (f: string | null) => void }) {
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1
    return acc
  }, {})

  const types = [
    { key: 'join', label: 'Join', color: 'text-green-400', activeBg: 'bg-green-950/40 border-green-800/60' },
    { key: 'move', label: 'Move', color: 'text-amber-400', activeBg: 'bg-amber-950/30 border-amber-800/60' },
    { key: 'leave', label: 'Leave', color: 'text-red-400', activeBg: 'bg-red-950/30 border-red-800/60' },
  ] as const

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setFilter(null)}
        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
          filter === null ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-400'
        }`}
      >
        All
      </button>
      {types.map(({ key, label, color, activeBg }) => (
        <button
          key={key}
          onClick={() => setFilter(filter === key ? null : key)}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
            filter === key ? `${activeBg} ${color}` : `border-transparent text-gray-500 hover:${color}`
          }`}
        >
          {label} <span className="font-mono ml-0.5">{counts[key] || 0}</span>
        </button>
      ))}
    </div>
  )
}
