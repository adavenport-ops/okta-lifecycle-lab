export interface EventEntry {
  timestamp: string
  event_id: string
  event_type: 'join' | 'move' | 'leave' | 'audit'
  employee_id: string
  action: string
  result: 'success' | 'failure' | 'retry'
  duration_ms?: number
  error?: string
  details?: {
    employee_name?: string
    email?: string
    department?: string
    title?: string
    okta_user_id?: string
    group?: string
    app?: string
    role?: string
    http_method?: string
    http_endpoint?: string
    http_status?: number
    groups_to_add?: string[]
    groups_to_remove?: string[]
    apps_to_provision?: Record<string, string>
    apps_to_deprovision?: string[]
    okta_disabled?: boolean
    sessions_revoked?: boolean
    sessions_count?: number
    apps_deprovisioned?: Record<string, boolean>
    previous_department?: string
    previous_title?: string
    scim_user_id?: string
    retry_count?: number
    audit_checks?: AuditCheck[]
  }
}

export interface AuditCheck {
  check: string
  result: 'pass' | 'fail'
  detail?: string
}

export interface Employee {
  employee_id: string
  email: string
  first_name: string
  last_name: string
  department: string
  title: string
  manager_email: string | null
  status: 'active' | 'terminated'
  start_date: string
  end_date: string | null
}

export interface EmployeeProfile {
  employee: Employee
  groups: string[]
  apps: Record<string, string>
  events: EventEntry[]
}

export interface LifecycleEvent {
  event_id: string
  event_type: 'join' | 'move' | 'leave' | 'audit'
  employee_id: string
  employee_name: string
  department: string
  title: string
  email: string
  timestamp: string
  actions: EventEntry[]
}
