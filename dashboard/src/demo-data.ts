import type { EventEntry, Employee } from './types'

// ---------------------------------------------------------------------------
// Helper: generate sequential timestamps a few hundred ms apart
// ---------------------------------------------------------------------------
function seqTs(base: string, count: number): string[] {
  const t0 = new Date(base).getTime()
  return Array.from({ length: count }, (_, i) =>
    new Date(t0 + i * (250 + Math.floor(i * 37) % 200)).toISOString().replace('Z', '').replace(/\.(\d{3})/, '.$1000'),
  )
}

// ---------------------------------------------------------------------------
// Employees (all 20)
// ---------------------------------------------------------------------------
export const demoEmployees: Employee[] = [
  { employee_id: 'EMP001', email: 'alice.chen@example.com', first_name: 'Alice', last_name: 'Chen', department: 'engineering', title: 'Senior Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-18', end_date: null },
  { employee_id: 'EMP002', email: 'bob.martinez@example.com', first_name: 'Bob', last_name: 'Martinez', department: 'engineering', title: 'Software Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-18', end_date: null },
  { employee_id: 'EMP003', email: 'carlos.rivera@example.com', first_name: 'Carlos', last_name: 'Rivera', department: 'engineering', title: 'Engineering Manager', manager_email: null, status: 'active', start_date: '2025-01-15', end_date: null },
  { employee_id: 'EMP004', email: 'diana.patel@example.com', first_name: 'Diana', last_name: 'Patel', department: 'product', title: 'Product Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2026-03-19', end_date: null },
  { employee_id: 'EMP005', email: 'ethan.nguyen@example.com', first_name: 'Ethan', last_name: 'Nguyen', department: 'sales', title: 'Account Executive', manager_email: 'frank.zhang@example.com', status: 'active', start_date: '2026-03-19', end_date: null },
  { employee_id: 'EMP006', email: 'frank.zhang@example.com', first_name: 'Frank', last_name: 'Zhang', department: 'sales', title: 'Sales Manager', manager_email: null, status: 'active', start_date: '2024-06-01', end_date: null },
  { employee_id: 'EMP007', email: 'grace.okonkwo@example.com', first_name: 'Grace', last_name: 'Okonkwo', department: 'product', title: 'VP Product', manager_email: null, status: 'active', start_date: '2024-03-10', end_date: null },
  { employee_id: 'EMP008', email: 'hassan.ali@example.com', first_name: 'Hassan', last_name: 'Ali', department: 'it', title: 'Security Engineer', manager_email: 'isabella.rossi@example.com', status: 'active', start_date: '2026-03-20', end_date: null },
  { employee_id: 'EMP009', email: 'isabella.rossi@example.com', first_name: 'Isabella', last_name: 'Rossi', department: 'it', title: 'IT Manager', manager_email: null, status: 'active', start_date: '2024-09-15', end_date: null },
  { employee_id: 'EMP010', email: 'james.kim@example.com', first_name: 'James', last_name: 'Kim', department: 'finance', title: 'Financial Analyst', manager_email: 'karen.wright@example.com', status: 'active', start_date: '2026-03-20', end_date: null },
  { employee_id: 'EMP011', email: 'karen.wright@example.com', first_name: 'Karen', last_name: 'Wright', department: 'finance', title: 'Controller', manager_email: null, status: 'active', start_date: '2024-11-01', end_date: null },
  { employee_id: 'EMP012', email: 'leo.tanaka@example.com', first_name: 'Leo', last_name: 'Tanaka', department: 'marketing', title: 'Content Specialist', manager_email: 'maria.santos@example.com', status: 'active', start_date: '2026-03-21', end_date: null },
  { employee_id: 'EMP013', email: 'maria.santos@example.com', first_name: 'Maria', last_name: 'Santos', department: 'marketing', title: 'Marketing Manager', manager_email: null, status: 'active', start_date: '2024-07-20', end_date: null },
  { employee_id: 'EMP014', email: 'nina.volkov@example.com', first_name: 'Nina', last_name: 'Volkov', department: 'people_ops', title: 'People Ops Specialist', manager_email: 'oliver.brown@example.com', status: 'active', start_date: '2026-03-21', end_date: null },
  { employee_id: 'EMP015', email: 'oliver.brown@example.com', first_name: 'Oliver', last_name: 'Brown', department: 'people_ops', title: 'People Ops Manager', manager_email: null, status: 'active', start_date: '2024-05-12', end_date: null },
  { employee_id: 'EMP016', email: 'priya.sharma@example.com', first_name: 'Priya', last_name: 'Sharma', department: 'engineering', title: 'Staff Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-22', end_date: null },
  { employee_id: 'EMP017', email: 'rachel.green@example.com', first_name: 'Rachel', last_name: 'Green', department: 'sales', title: 'Sales Rep', manager_email: 'frank.zhang@example.com', status: 'terminated', start_date: '2025-02-01', end_date: '2026-03-23' },
  { employee_id: 'EMP018', email: 'samuel.jackson@example.com', first_name: 'Samuel', last_name: 'Jackson', department: 'it', title: 'IT Support Specialist', manager_email: 'isabella.rossi@example.com', status: 'terminated', start_date: '2025-04-10', end_date: '2026-03-24' },
  { employee_id: 'EMP019', email: 'tara.oconnell@example.com', first_name: 'Tara', last_name: "O'Connell", department: 'engineering', title: 'Software Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2025-06-15', end_date: null },
  { employee_id: 'EMP020', email: 'victor.huang@example.com', first_name: 'Victor', last_name: 'Huang', department: 'product', title: 'Senior Product Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2025-03-01', end_date: null },
]

// ---------------------------------------------------------------------------
// Joiner helper
// ---------------------------------------------------------------------------
function joinerEvents(
  empId: string,
  name: string,
  email: string,
  department: string,
  title: string,
  oktaId: string,
  groups: string[],
  apps: Record<string, string>,
  eventId: string,
  baseTs: string,
): EventEntry[] {
  const actions: EventEntry[] = []
  const totalSteps = 1 + groups.length + Object.keys(apps).length
  const ts = seqTs(baseTs, totalSteps)
  let i = 0

  actions.push({
    timestamp: ts[i++],
    event_id: eventId,
    event_type: 'join',
    employee_id: empId,
    action: 'create_user',
    result: 'success',
    duration_ms: 145 + (empId.charCodeAt(4) % 60),
    details: { employee_name: name, email, department, title, okta_user_id: oktaId },
  })

  for (const group of groups) {
    actions.push({
      timestamp: ts[i++],
      event_id: eventId,
      event_type: 'join',
      employee_id: empId,
      action: 'add_group',
      result: 'success',
      duration_ms: 55 + (group.length % 45),
      details: { group },
    })
  }

  for (const [app, role] of Object.entries(apps)) {
    actions.push({
      timestamp: ts[i++],
      event_id: eventId,
      event_type: 'join',
      employee_id: empId,
      action: 'provision_app',
      result: 'success',
      duration_ms: 95 + (app.length * 11) % 85,
      details: { app, role },
    })
  }

  return actions
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
const allEvents: EventEntry[] = [
  // ── EMP001 Alice Chen — Senior Engineer (joiner) ──────────────────────
  ...joinerEvents(
    'EMP001', 'Alice Chen', 'alice.chen@example.com', 'engineering', 'Senior Engineer', '00u10010001',
    ['eng-all', 'github-org-members', 'eng-senior', 'on-call-rotation'],
    { github: 'maintainer', slack: 'member', zoom: 'licensed' },
    'evt-a1b2c3d4-e5f6-7890-abcd-ef1234567001',
    '2026-03-18T09:02:14.312000',
  ),

  // ── EMP002 Bob Martinez — Software Engineer (joiner) ──────────────────
  ...joinerEvents(
    'EMP002', 'Bob Martinez', 'bob.martinez@example.com', 'engineering', 'Software Engineer', '00u10010002',
    ['eng-all', 'github-org-members'],
    { github: 'developer', slack: 'member', zoom: 'licensed' },
    'evt-b2c3d4e5-f6a7-8901-bcde-f12345670002',
    '2026-03-18T09:30:45.100000',
  ),

  // ── EMP004 Diana Patel — Product Manager (joiner) ─────────────────────
  ...joinerEvents(
    'EMP004', 'Diana Patel', 'diana.patel@example.com', 'product', 'Product Manager', '00u10010004',
    ['product-all', 'product-leads'],
    { figma: 'editor', slack: 'member', zoom: 'licensed' },
    'evt-d4e5f6a7-8901-bcde-f123-456700040004',
    '2026-03-19T08:15:33.450000',
  ),

  // ── EMP005 Ethan Nguyen — Account Executive (joiner) ──────────────────
  ...joinerEvents(
    'EMP005', 'Ethan Nguyen', 'ethan.nguyen@example.com', 'sales', 'Account Executive', '00u10010005',
    ['sales-all', 'crm-users', 'sales-ae'],
    { salesforce: 'user', slack: 'member', zoom: 'licensed', hubspot: 'user' },
    'evt-e5f6a7b8-9012-cdef-0123-456700050005',
    '2026-03-19T10:44:12.880000',
  ),

  // ── EMP008 Hassan Ali — Security Engineer (joiner) ────────────────────
  ...joinerEvents(
    'EMP008', 'Hassan Ali', 'hassan.ali@example.com', 'it', 'Security Engineer', '00u10010008',
    ['it-all', 'okta-admins', 'security-team', 'incident-response'],
    { slack: 'member', zoom: 'licensed', github: 'developer' },
    'evt-h8i9j0k1-2345-6789-abcd-ef0000080008',
    '2026-03-20T08:05:22.200000',
  ),

  // ── EMP010 James Kim — Financial Analyst (joiner) ─────────────────────
  ...joinerEvents(
    'EMP010', 'James Kim', 'james.kim@example.com', 'finance', 'Financial Analyst', '00u10010010',
    ['finance-all'],
    { netsuite: 'user', slack: 'member', zoom: 'licensed' },
    'evt-j0k1l2m3-4567-89ab-cdef-010000100010',
    '2026-03-20T11:20:05.670000',
  ),

  // ── EMP012 Leo Tanaka — Content Specialist (joiner) ───────────────────
  ...joinerEvents(
    'EMP012', 'Leo Tanaka', 'leo.tanaka@example.com', 'marketing', 'Content Specialist', '00u10010012',
    ['mkt-all'],
    { hubspot: 'user', slack: 'member', figma: 'viewer' },
    'evt-l2m3n4o5-6789-abcd-ef01-230000120012',
    '2026-03-21T09:10:38.120000',
  ),

  // ── EMP014 Nina Volkov — People Ops Specialist (joiner) ───────────────
  ...joinerEvents(
    'EMP014', 'Nina Volkov', 'nina.volkov@example.com', 'people_ops', 'People Ops Specialist', '00u10010014',
    ['people-all', 'hris-users'],
    { slack: 'member', zoom: 'licensed', rippling: 'admin' },
    'evt-n4o5p6q7-89ab-cdef-0123-450000140014',
    '2026-03-21T13:45:10.550000',
  ),

  // ── EMP016 Priya Sharma — Staff Engineer (joiner) ─────────────────────
  ...joinerEvents(
    'EMP016', 'Priya Sharma', 'priya.sharma@example.com', 'engineering', 'Staff Engineer', '00u10010016',
    ['eng-all', 'github-org-members', 'eng-senior', 'architecture-review'],
    { github: 'maintainer', slack: 'member', zoom: 'licensed' },
    'evt-p6q7r8s9-abcd-ef01-2345-670000160016',
    '2026-03-22T08:30:00.340000',
  ),

  // ── EMP019 Tara O'Connell — mover (marketing → engineering) ───────────
  ...(() => {
    const eventId = 'evt-t9u0v1w2-cdef-0123-4567-890000190019'
    const empId = 'EMP019'
    const ts = seqTs('2026-03-23T10:15:44.200000', 8)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'compute_diff', result: 'success', duration_ms: 88,
      details: {
        employee_name: "Tara O'Connell", email: 'tara.oconnell@example.com', department: 'engineering', title: 'Software Engineer',
        groups_to_add: ['eng-all', 'github-org-members'],
        groups_to_remove: ['mkt-all'],
        apps_to_provision: { github: 'developer', zoom: 'licensed' },
        apps_to_deprovision: ['hubspot', 'figma'],
      },
    })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 62, details: { group: 'mkt-all' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'add_group', result: 'success', duration_ms: 58, details: { group: 'eng-all' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'add_group', result: 'success', duration_ms: 61, details: { group: 'github-org-members' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 110, details: { app: 'hubspot' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 105, details: { app: 'figma' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'provision_app', result: 'success', duration_ms: 130, details: { app: 'github', role: 'developer' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'provision_app', result: 'success', duration_ms: 98, details: { app: 'zoom', role: 'licensed' } })

    return entries
  })(),

  // ── EMP020 Victor Huang — mover (engineering → product) ───────────────
  ...(() => {
    const eventId = 'evt-v1w2x3y4-ef01-2345-6789-ab0000200020'
    const empId = 'EMP020'
    const ts = seqTs('2026-03-23T14:30:11.700000', 10)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'compute_diff', result: 'success', duration_ms: 92,
      details: {
        employee_name: 'Victor Huang', email: 'victor.huang@example.com', department: 'product', title: 'Senior Product Manager',
        groups_to_add: ['product-all', 'product-leads', 'exec-team'],
        groups_to_remove: ['eng-all', 'github-org-members', 'eng-senior', 'on-call-rotation'],
        apps_to_provision: { figma: 'editor' },
        apps_to_deprovision: ['github'],
      },
    })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 59, details: { group: 'eng-all' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 64, details: { group: 'github-org-members' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 57, details: { group: 'eng-senior' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 63, details: { group: 'on-call-rotation' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'add_group', result: 'success', duration_ms: 55, details: { group: 'product-all' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'add_group', result: 'success', duration_ms: 60, details: { group: 'product-leads' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'add_group', result: 'success', duration_ms: 58, details: { group: 'exec-team' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 115, details: { app: 'github' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId, action: 'provision_app', result: 'success', duration_ms: 125, details: { app: 'figma', role: 'editor' } })

    return entries
  })(),

  // ── EMP017 Rachel Green — leaver (sales) ──────────────────────────────
  ...(() => {
    const eventId = 'evt-r7s8t9u0-1234-5678-9abc-de0000170017'
    const empId = 'EMP017'
    // Rachel was Sales Rep: groups [sales-all, crm-users], apps {salesforce, slack, zoom, hubspot}
    const ts = seqTs('2026-03-23T16:00:05.400000', 9)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'disable_user', result: 'success', duration_ms: 134, details: { employee_name: 'Rachel Green', email: 'rachel.green@example.com', department: 'sales', title: 'Sales Rep' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'revoke_sessions', result: 'success', duration_ms: 78 })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 112, details: { app: 'salesforce' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 96, details: { app: 'slack' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 89, details: { app: 'zoom' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 101, details: { app: 'hubspot' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 55, details: { group: 'sales-all' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 52, details: { group: 'crm-users' } })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'post_deprovision_audit', result: 'success', duration_ms: 45,
      details: {
        okta_disabled: true,
        sessions_revoked: true,
        apps_deprovisioned: { salesforce: true, slack: true, zoom: true, hubspot: true },
      },
    })

    return entries
  })(),

  // ── EMP018 Samuel Jackson — leaver (it) ───────────────────────────────
  ...(() => {
    const eventId = 'evt-s8t9u0v1-2345-6789-abcd-ef0000180018'
    const empId = 'EMP018'
    // Samuel was IT Support Specialist: groups [it-all, okta-admins], apps {slack, zoom, github}
    const ts = seqTs('2026-03-24T09:15:30.100000', 8)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'disable_user', result: 'success', duration_ms: 128, details: { employee_name: 'Samuel Jackson', email: 'samuel.jackson@example.com', department: 'it', title: 'IT Support Specialist' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'revoke_sessions', result: 'success', duration_ms: 82 })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 105, details: { app: 'slack' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 92, details: { app: 'zoom' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'deprovision_app', result: 'success', duration_ms: 118, details: { app: 'github' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 58, details: { group: 'it-all' } })
    entries.push({ timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId, action: 'remove_group', result: 'success', duration_ms: 54, details: { group: 'okta-admins' } })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'post_deprovision_audit', result: 'success', duration_ms: 41,
      details: {
        okta_disabled: true,
        sessions_revoked: true,
        apps_deprovisioned: { slack: true, zoom: true, github: true },
      },
    })

    return entries
  })(),
]

export const demoEvents: EventEntry[] = allEvents
