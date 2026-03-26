import { useEffect, useRef, useState } from 'react'
import type { Employee, EventEntry, LifecycleEvent } from './types'
import { demoEvents, demoEmployees } from './demo-data'

const SSE_URL = import.meta.env.VITE_SSE_URL || '/events'
const API_URL = import.meta.env.VITE_API_URL || ''

export function useSSE() {
  const [events, setEvents] = useState<EventEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const failCountRef = useRef(0)

  useEffect(() => {
    let source: EventSource

    function loadDemo() {
      setDemoMode(true)
      setConnected(false)
      // Drip-feed demo events for a nice loading animation
      let i = 0
      const interval = setInterval(() => {
        const batch = demoEvents.slice(i, i + 3)
        if (batch.length === 0) {
          clearInterval(interval)
          return
        }
        setEvents((prev) => [...prev, ...batch])
        i += 3
      }, 60)
      return () => clearInterval(interval)
    }

    function connect() {
      try {
        source = new EventSource(SSE_URL)
      } catch {
        loadDemo()
        return
      }
      source.onopen = () => {
        failCountRef.current = 0
        setConnected(true)
      }
      source.onerror = () => {
        setConnected(false)
        source.close()
        failCountRef.current++
        if (failCountRef.current >= 2) {
          loadDemo()
        } else {
          retryRef.current = setTimeout(connect, 2000)
        }
      }
      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'connected') {
            setConnected(true)
            return
          }
          setEvents((prev) => [...prev, data as EventEntry])
        } catch {
          // skip malformed
        }
      }
    }

    connect()
    return () => {
      source?.close()
      clearTimeout(retryRef.current)
    }
  }, [])

  return { events, connected, demoMode }
}

export function useEmployees(demoMode: boolean) {
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    if (demoMode) {
      setEmployees(demoEmployees)
      return
    }
    fetch(`${API_URL}/api/employees`)
      .then((r) => r.json())
      .then((data) => setEmployees(data.employees || []))
      .catch(() => setEmployees(demoEmployees))
  }, [demoMode])

  return employees
}

/** Group raw event entries into lifecycle events (by event_id). */
export function groupEvents(events: EventEntry[]): LifecycleEvent[] {
  const map = new Map<string, LifecycleEvent>()

  for (const entry of events) {
    let evt = map.get(entry.event_id)
    if (!evt) {
      evt = {
        event_id: entry.event_id,
        event_type: entry.event_type,
        employee_id: entry.employee_id,
        employee_name: entry.details?.employee_name || entry.employee_id,
        department: entry.details?.department || '',
        title: entry.details?.title || '',
        email: entry.details?.email || '',
        timestamp: entry.timestamp,
        actions: [],
      }
      map.set(entry.event_id, evt)
    }
    // Fill in metadata from any entry that has it
    if (entry.details?.employee_name && evt.employee_name === evt.employee_id) {
      evt.employee_name = entry.details.employee_name
      evt.department = entry.details.department || evt.department
      evt.title = entry.details.title || evt.title
      evt.email = entry.details.email || evt.email
    }
    evt.actions.push(entry)
  }

  return Array.from(map.values())
}
