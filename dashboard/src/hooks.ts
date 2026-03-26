import { useEffect, useRef, useState } from 'react'
import type { Employee, EventEntry, LifecycleEvent } from './types'

const SSE_URL = import.meta.env.VITE_SSE_URL || '/events'
const API_URL = import.meta.env.VITE_API_URL || ''

export function useSSE() {
  const [events, setEvents] = useState<EventEntry[]>([])
  const [connected, setConnected] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    let source: EventSource

    function connect() {
      source = new EventSource(SSE_URL)
      source.onopen = () => setConnected(true)
      source.onerror = () => {
        setConnected(false)
        source.close()
        retryRef.current = setTimeout(connect, 3000)
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

  return { events, connected }
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/employees`)
      .then((r) => r.json())
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [])

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
