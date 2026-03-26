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
// Employees (24 total)
// ---------------------------------------------------------------------------
export const demoEmployees: Employee[] = [
  { employee_id: 'EMP001', email: 'alice.chen@example.com', first_name: 'Alice', last_name: 'Chen', department: 'engineering', title: 'Senior Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-18', end_date: null },
  { employee_id: 'EMP002', email: 'bob.martinez@example.com', first_name: 'Bob', last_name: 'Martinez', department: 'engineering', title: 'Software Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-18', end_date: null },
  { employee_id: 'EMP003', email: 'carlos.rivera@example.com', first_name: 'Carlos', last_name: 'Rivera', department: 'engineering', title: 'Engineering Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2024-06-15', end_date: null },
  { employee_id: 'EMP004', email: 'diana.patel@example.com', first_name: 'Diana', last_name: 'Patel', department: 'product', title: 'Product Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2026-03-19', end_date: null },
  { employee_id: 'EMP005', email: 'ethan.nguyen@example.com', first_name: 'Ethan', last_name: 'Nguyen', department: 'sales', title: 'Account Executive', manager_email: 'frank.zhang@example.com', status: 'active', start_date: '2026-03-19', end_date: null },
  { employee_id: 'EMP006', email: 'frank.zhang@example.com', first_name: 'Frank', last_name: 'Zhang', department: 'sales', title: 'Sales Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2024-09-01', end_date: null },
  { employee_id: 'EMP007', email: 'grace.okonkwo@example.com', first_name: 'Grace', last_name: 'Okonkwo', department: 'product', title: 'VP Product', manager_email: null, status: 'active', start_date: '2023-01-10', end_date: null },
  { employee_id: 'EMP008', email: 'hassan.ali@example.com', first_name: 'Hassan', last_name: 'Ali', department: 'it', title: 'Security Engineer', manager_email: 'isabella.rossi@example.com', status: 'active', start_date: '2026-03-20', end_date: null },
  { employee_id: 'EMP009', email: 'isabella.rossi@example.com', first_name: 'Isabella', last_name: 'Rossi', department: 'it', title: 'IT Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2024-02-20', end_date: null },
  { employee_id: 'EMP010', email: 'james.kim@example.com', first_name: 'James', last_name: 'Kim', department: 'finance', title: 'Financial Analyst', manager_email: 'karen.wright@example.com', status: 'active', start_date: '2026-03-20', end_date: null },
  { employee_id: 'EMP011', email: 'karen.wright@example.com', first_name: 'Karen', last_name: 'Wright', department: 'finance', title: 'Controller', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2024-04-01', end_date: null },
  { employee_id: 'EMP012', email: 'leo.tanaka@example.com', first_name: 'Leo', last_name: 'Tanaka', department: 'marketing', title: 'Content Specialist', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2026-03-21', end_date: null },
  { employee_id: 'EMP013', email: 'maria.santos@example.com', first_name: 'Maria', last_name: 'Santos', department: 'legal', title: 'Legal Counsel', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2026-03-21', end_date: null },
  { employee_id: 'EMP014', email: 'nina.volkov@example.com', first_name: 'Nina', last_name: 'Volkov', department: 'people_ops', title: 'People Ops Specialist', manager_email: 'oliver.brown@example.com', status: 'active', start_date: '2026-03-21', end_date: null },
  { employee_id: 'EMP015', email: 'oliver.brown@example.com', first_name: 'Oliver', last_name: 'Brown', department: 'people_ops', title: 'People Ops Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2024-11-01', end_date: null },
  { employee_id: 'EMP016', email: 'priya.sharma@example.com', first_name: 'Priya', last_name: 'Sharma', department: 'engineering', title: 'Staff Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-22', end_date: null },
  { employee_id: 'EMP017', email: 'rachel.kim@example.com', first_name: 'Rachel', last_name: 'Kim', department: 'sales', title: 'Sales Rep', manager_email: 'frank.zhang@example.com', status: 'terminated', start_date: '2024-08-01', end_date: '2026-03-23' },
  { employee_id: 'EMP018', email: 'tom.bradley@example.com', first_name: 'Tom', last_name: 'Bradley', department: 'it', title: 'IT Systems Engineer', manager_email: 'isabella.rossi@example.com', status: 'terminated', start_date: '2025-03-01', end_date: '2026-03-23' },
  { employee_id: 'EMP019', email: 'sarah.chen@example.com', first_name: 'Sarah', last_name: 'Chen', department: 'engineering', title: 'Software Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2025-06-01', end_date: null },
  { employee_id: 'EMP020', email: 'marcus.rivera@example.com', first_name: 'Marcus', last_name: 'Rivera', department: 'product', title: 'Senior Product Manager', manager_email: 'grace.okonkwo@example.com', status: 'active', start_date: '2024-12-01', end_date: null },
  { employee_id: 'EMP021', email: 'wei.zhang@example.com', first_name: 'Wei', last_name: 'Zhang', department: 'sales', title: 'Sales Manager', manager_email: 'frank.zhang@example.com', status: 'active', start_date: '2025-02-15', end_date: null },
  { employee_id: 'EMP022', email: 'jordan.brooks@example.com', first_name: 'Jordan', last_name: 'Brooks', department: 'engineering', title: 'Software Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2025-08-01', end_date: null },
  { employee_id: 'EMP023', email: 'derek.washington@example.com', first_name: 'Derek', last_name: 'Washington', department: 'engineering', title: 'Software Engineer', manager_email: 'carlos.rivera@example.com', status: 'active', start_date: '2026-03-22', end_date: null },
  { employee_id: 'EMP024', email: 'alex.torres@example.com', first_name: 'Alex', last_name: 'Torres', department: 'engineering', title: 'Junior Engineer', manager_email: 'carlos.rivera@example.com', status: 'terminated', start_date: '2026-01-15', end_date: '2026-03-24' },
  { employee_id: 'EMP025', email: 'sofia.petrova@example.com', first_name: 'Sofia', last_name: 'Petrova', department: 'sales', title: 'Account Executive', manager_email: 'frank.zhang@example.com', status: 'active', start_date: '2026-03-22', end_date: null },
  { employee_id: 'EMP026', email: 'yuki.tanabe@example.com', first_name: 'Yuki', last_name: 'Tanabe', department: 'finance', title: 'Junior Analyst', manager_email: 'karen.wright@example.com', status: 'active', start_date: '2026-03-23', end_date: null },
]

// ---------------------------------------------------------------------------
// Joiner helper — generates create_user + add_group + provision_app entries
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

  // create_user
  actions.push({
    timestamp: ts[i++],
    event_id: eventId,
    event_type: 'join',
    employee_id: empId,
    action: 'create_user',
    result: 'success',
    duration_ms: 145 + (empId.charCodeAt(4) % 60),
    details: {
      employee_name: name, email, department, title,
      okta_user_id: oktaId,
      http_method: 'POST',
      http_endpoint: '/api/v1/users',
      http_status: 200,
    },
  })

  // add_group for each group
  for (const group of groups) {
    actions.push({
      timestamp: ts[i++],
      event_id: eventId,
      event_type: 'join',
      employee_id: empId,
      action: 'add_group',
      result: 'success',
      duration_ms: 55 + (group.length % 45),
      details: {
        group,
        http_method: 'PUT',
        http_endpoint: `/api/v1/groups/grp_${group}/users/${oktaId}`,
        http_status: 204,
      },
    })
  }

  // provision_app for each app
  for (const [app, role] of Object.entries(apps)) {
    const scimPrefix = app === 'github' ? 'gu' : app === 'slack' ? 'su' : app === 'zoom' ? 'zu' : app === 'salesforce' ? 'sf' : app === 'hubspot' ? 'hu' : app === 'figma' ? 'fg' : app === 'netsuite' ? 'ns' : app === 'rippling' ? 'rp' : 'sc'
    const namePart = name.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_')
    actions.push({
      timestamp: ts[i++],
      event_id: eventId,
      event_type: 'join',
      employee_id: empId,
      action: 'provision_app',
      result: 'success',
      duration_ms: 95 + (app.length * 11) % 85,
      details: {
        app,
        role,
        scim_user_id: `${scimPrefix}_${namePart}_001`,
        http_method: 'POST',
        http_endpoint: `/${app}/scim/v2/Users`,
        http_status: 201,
      },
    })
  }

  return actions
}

// ---------------------------------------------------------------------------
// All Events
// ---------------------------------------------------------------------------
const allEvents: EventEntry[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // JOINERS (9)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── EMP001 Alice Chen — Senior Engineer ─────────────────────────────────
  ...joinerEvents(
    'EMP001', 'Alice Chen', 'alice.chen@example.com', 'engineering', 'Senior Engineer', '00uALC00001',
    ['eng-all', 'github-org-members', 'eng-senior', 'on-call-rotation'],
    { github: 'maintainer', slack: 'member', zoom: 'licensed' },
    'evt-a1b2c3d4-e5f6-7890-abcd-ef1234567001',
    '2026-03-18T09:02:14.312000',
  ),

  // ── EMP002 Bob Martinez — Software Engineer ─────────────────────────────
  ...joinerEvents(
    'EMP002', 'Bob Martinez', 'bob.martinez@example.com', 'engineering', 'Software Engineer', '00uBMZ00002',
    ['eng-all', 'github-org-members'],
    { github: 'developer', slack: 'member', zoom: 'licensed' },
    'evt-b2c3d4e5-f6a7-8901-bcde-f12345670002',
    '2026-03-18T09:30:45.100000',
  ),

  // ── EMP004 Diana Patel — Product Manager ────────────────────────────────
  ...joinerEvents(
    'EMP004', 'Diana Patel', 'diana.patel@example.com', 'product', 'Product Manager', '00uDPT00004',
    ['product-all', 'product-leads'],
    { figma: 'editor', slack: 'member', zoom: 'licensed' },
    'evt-d4e5f6a7-8901-bcde-f123-456700040004',
    '2026-03-19T08:15:33.450000',
  ),

  // ── EMP005 Ethan Nguyen — Account Executive ─────────────────────────────
  ...joinerEvents(
    'EMP005', 'Ethan Nguyen', 'ethan.nguyen@example.com', 'sales', 'Account Executive', '00uENG00005',
    ['sales-all', 'crm-users', 'sales-ae'],
    { salesforce: 'user', slack: 'member', zoom: 'licensed', hubspot: 'user' },
    'evt-e5f6a7b8-9012-cdef-0123-456700050005',
    '2026-03-19T10:44:12.880000',
  ),

  // ── EMP008 Hassan Ali — Security Engineer ───────────────────────────────
  ...joinerEvents(
    'EMP008', 'Hassan Ali', 'hassan.ali@example.com', 'it', 'Security Engineer', '00uHAL00008',
    ['it-all', 'okta-admins', 'security-team', 'incident-response'],
    { slack: 'member', zoom: 'licensed', github: 'developer' },
    'evt-h8i9j0k1-2345-6789-abcd-ef0000080008',
    '2026-03-20T08:05:22.200000',
  ),

  // ── EMP010 James Kim — Financial Analyst ────────────────────────────────
  ...joinerEvents(
    'EMP010', 'James Kim', 'james.kim@example.com', 'finance', 'Financial Analyst', '00uJKM00010',
    ['finance-all'],
    { netsuite: 'user', slack: 'member', zoom: 'licensed' },
    'evt-j0k1l2m3-4567-89ab-cdef-010000100010',
    '2026-03-20T11:20:05.670000',
  ),

  // ── EMP012 Leo Tanaka — Content Specialist ──────────────────────────────
  ...joinerEvents(
    'EMP012', 'Leo Tanaka', 'leo.tanaka@example.com', 'marketing', 'Content Specialist', '00uLTK00012',
    ['mkt-all'],
    { hubspot: 'user', slack: 'member', figma: 'viewer' },
    'evt-l2m3n4o5-6789-abcd-ef01-230000120012',
    '2026-03-21T09:10:38.120000',
  ),

  // ── EMP014 Nina Volkov — People Ops Specialist ──────────────────────────
  ...joinerEvents(
    'EMP014', 'Nina Volkov', 'nina.volkov@example.com', 'people_ops', 'People Ops Specialist', '00uNVK00014',
    ['people-all', 'hris-users'],
    { slack: 'member', zoom: 'licensed', rippling: 'admin' },
    'evt-n4o5p6q7-89ab-cdef-0123-450000140014',
    '2026-03-21T13:45:10.550000',
  ),

  // ── EMP016 Priya Sharma — Staff Engineer ────────────────────────────────
  ...joinerEvents(
    'EMP016', 'Priya Sharma', 'priya.sharma@example.com', 'engineering', 'Staff Engineer', '00uPSH00016',
    ['eng-all', 'github-org-members', 'eng-senior', 'architecture-review'],
    { github: 'maintainer', slack: 'member', zoom: 'licensed' },
    'evt-p6q7r8s9-abcd-ef01-2345-670000160016',
    '2026-03-22T08:30:00.340000',
  ),

  // ── EMP013 Maria Santos — Legal Counsel ───────────────────────────────
  ...joinerEvents(
    'EMP013', 'Maria Santos', 'maria.santos@example.com', 'legal', 'Legal Counsel', '00uMST00013',
    ['legal-all', 'compliance-team'],
    { slack: 'member', zoom: 'licensed', netsuite: 'viewer' },
    'evt-ms13join-abcd-ef01-2345-670000130013',
    '2026-03-21T10:15:22.100000',
  ),

  // ── EMP025 Sofia Petrova — Account Executive ─────────────────────────
  ...joinerEvents(
    'EMP025', 'Sofia Petrova', 'sofia.petrova@example.com', 'sales', 'Account Executive', '00uSPT00025',
    ['sales-all', 'crm-users', 'sales-ae'],
    { salesforce: 'user', hubspot: 'user', slack: 'member', zoom: 'licensed' },
    'evt-sp25join-bcde-f012-3456-780000250025',
    '2026-03-22T11:05:44.300000',
  ),

  // ── EMP026 Yuki Tanabe — Junior Analyst ───────────────────────────────
  ...joinerEvents(
    'EMP026', 'Yuki Tanabe', 'yuki.tanabe@example.com', 'finance', 'Junior Analyst', '00uYTB00026',
    ['finance-all'],
    { netsuite: 'user', slack: 'member', zoom: 'licensed' },
    'evt-yt26join-cdef-0123-4567-890000260026',
    '2026-03-23T08:30:18.650000',
  ),

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR JOINER — EMP023 Derek Washington (join with SCIM conflict + retry)
  // ═══════════════════════════════════════════════════════════════════════════
  ...(() => {
    const eventId = 'evt-dw23err0-4567-89ab-cdef-230000230023'
    const empId = 'EMP023'
    const oktaId = '00uDWS00023'
    const ts = seqTs('2026-03-22T09:45:11.200000', 7)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'create_user', result: 'success', duration_ms: 162,
      details: {
        employee_name: 'Derek Washington', email: 'derek.washington@example.com',
        department: 'engineering', title: 'Software Engineer',
        okta_user_id: oktaId,
        http_method: 'POST', http_endpoint: '/api/v1/users', http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 58,
      details: { group: 'eng-all', http_method: 'PUT', http_endpoint: `/api/v1/groups/grp_eng-all/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 61,
      details: { group: 'github-org-members', http_method: 'PUT', http_endpoint: `/api/v1/groups/grp_github-org-members/users/${oktaId}`, http_status: 204 },
    })
    // FAILURE: SCIM 409 Conflict
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'provision_app', result: 'failure', duration_ms: 234,
      error: 'SCIM 409 Conflict: userName derek.washington@example.com already exists in target system',
      details: {
        app: 'github', role: 'developer',
        http_method: 'POST', http_endpoint: '/github/scim/v2/Users', http_status: 409,
      },
    })
    // RETRY succeeds
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'provision_app', result: 'retry', duration_ms: 189,
      details: {
        app: 'github', role: 'developer',
        scim_user_id: 'gu_derek_washington_001',
        retry_count: 1,
        http_method: 'POST', http_endpoint: '/github/scim/v2/Users', http_status: 201,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'provision_app', result: 'success', duration_ms: 102,
      details: {
        app: 'slack', role: 'member',
        scim_user_id: 'su_derek_washington_001',
        http_method: 'POST', http_endpoint: '/slack/scim/v2/Users', http_status: 201,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'join', employee_id: empId,
      action: 'provision_app', result: 'success', duration_ms: 97,
      details: {
        app: 'zoom', role: 'licensed',
        scim_user_id: 'zu_derek_washington_001',
        http_method: 'POST', http_endpoint: '/zoom/scim/v2/Users', http_status: 201,
      },
    })

    return entries
  })(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVERS (4)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── EMP019 Sarah Chen — Marketing Content Specialist → Engineering Software Engineer
  ...(() => {
    const eventId = 'evt-sc19mov0-cdef-0123-4567-890000190019'
    const empId = 'EMP019'
    const ts = seqTs('2026-03-22T14:22:08.500000', 8)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'compute_diff', result: 'success', duration_ms: 88,
      details: {
        employee_name: 'Sarah Chen', email: 'sarah.chen@example.com',
        department: 'engineering', title: 'Software Engineer',
        previous_department: 'marketing', previous_title: 'Content Specialist',
        groups_to_add: ['eng-all', 'github-org-members'],
        groups_to_remove: ['mkt-all'],
        apps_to_provision: { github: 'developer', zoom: 'licensed' },
        apps_to_deprovision: ['hubspot', 'figma'],
        http_method: 'GET', http_endpoint: '/api/v1/users/00uSCH00019/groups', http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 62,
      details: { group: 'mkt-all', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_mkt-all/users/00uSCH00019', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 58,
      details: { group: 'eng-all', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_eng-all/users/00uSCH00019', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 61,
      details: { group: 'github-org-members', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_github-org-members/users/00uSCH00019', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 110,
      details: { app: 'hubspot', http_method: 'DELETE', http_endpoint: '/hubspot/scim/v2/Users/hu_sarah_chen_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 105,
      details: { app: 'figma', http_method: 'DELETE', http_endpoint: '/figma/scim/v2/Users/fg_sarah_chen_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'provision_app', result: 'success', duration_ms: 130,
      details: { app: 'github', role: 'developer', scim_user_id: 'gu_sarah_chen_001', http_method: 'POST', http_endpoint: '/github/scim/v2/Users', http_status: 201 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'provision_app', result: 'success', duration_ms: 98,
      details: { app: 'zoom', role: 'licensed', scim_user_id: 'zu_sarah_chen_001', http_method: 'POST', http_endpoint: '/zoom/scim/v2/Users', http_status: 201 },
    })

    return entries
  })(),

  // ── EMP020 Marcus Rivera — Engineering Senior Engineer → Product Senior Product Manager
  ...(() => {
    const eventId = 'evt-mr20mov0-ef01-2345-6789-ab0000200020'
    const empId = 'EMP020'
    const ts = seqTs('2026-03-22T16:30:22.700000', 10)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'compute_diff', result: 'success', duration_ms: 92,
      details: {
        employee_name: 'Marcus Rivera', email: 'marcus.rivera@example.com',
        department: 'product', title: 'Senior Product Manager',
        previous_department: 'engineering', previous_title: 'Senior Engineer',
        groups_to_add: ['product-all', 'product-leads', 'exec-team'],
        groups_to_remove: ['eng-all', 'github-org-members', 'eng-senior', 'on-call-rotation'],
        apps_to_provision: { figma: 'editor' },
        apps_to_deprovision: ['github'],
        http_method: 'GET', http_endpoint: '/api/v1/users/00uMRV00020/groups', http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 59,
      details: { group: 'eng-all', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_eng-all/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 64,
      details: { group: 'github-org-members', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_github-org-members/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 57,
      details: { group: 'eng-senior', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_eng-senior/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 63,
      details: { group: 'on-call-rotation', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_on-call-rotation/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 55,
      details: { group: 'product-all', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_product-all/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 60,
      details: { group: 'product-leads', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_product-leads/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 58,
      details: { group: 'exec-team', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_exec-team/users/00uMRV00020', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 115,
      details: { app: 'github', http_method: 'DELETE', http_endpoint: '/github/scim/v2/Users/gu_marcus_rivera_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'provision_app', result: 'success', duration_ms: 125,
      details: { app: 'figma', role: 'editor', scim_user_id: 'fg_marcus_rivera_001', http_method: 'POST', http_endpoint: '/figma/scim/v2/Users', http_status: 201 },
    })

    return entries
  })(),

  // ── EMP021 Wei Zhang — Sales Rep → Sales Manager (same dept, role elevation)
  ...(() => {
    const eventId = 'evt-wz21mov0-1234-5678-9abc-de0000210021'
    const empId = 'EMP021'
    const ts = seqTs('2026-03-23T09:15:05.300000', 4)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'compute_diff', result: 'success', duration_ms: 76,
      details: {
        employee_name: 'Wei Zhang', email: 'wei.zhang@example.com',
        department: 'sales', title: 'Sales Manager',
        previous_department: 'sales', previous_title: 'Sales Rep',
        groups_to_add: ['sales-leads', 'people-managers'],
        groups_to_remove: [],
        apps_to_provision: { salesforce: 'admin' },
        apps_to_deprovision: [],
        http_method: 'GET', http_endpoint: '/api/v1/users/00uWZH00021/groups', http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 54,
      details: { group: 'sales-leads', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_sales-leads/users/00uWZH00021', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 57,
      details: { group: 'people-managers', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_people-managers/users/00uWZH00021', http_status: 204 },
    })
    // Role upgrade via PATCH, not POST
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'provision_app', result: 'success', duration_ms: 142,
      details: { app: 'salesforce', role: 'admin', scim_user_id: 'sf_wei_zhang_001', http_method: 'PATCH', http_endpoint: '/salesforce/scim/v2/Users/sf_wei_zhang_001', http_status: 200 },
    })

    return entries
  })(),

  // ── EMP022 Jordan Brooks — IT Systems Engineer → Engineering Software Engineer
  ...(() => {
    const eventId = 'evt-jb22mov0-2345-6789-abcd-ef0000220022'
    const empId = 'EMP022'
    const ts = seqTs('2026-03-23T11:45:33.100000', 6)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'compute_diff', result: 'success', duration_ms: 81,
      details: {
        employee_name: 'Jordan Brooks', email: 'jordan.brooks@example.com',
        department: 'engineering', title: 'Software Engineer',
        previous_department: 'it', previous_title: 'IT Systems Engineer',
        groups_to_add: ['eng-all', 'github-org-members'],
        groups_to_remove: ['it-all', 'okta-admins', 'security-team'],
        apps_to_provision: {},
        apps_to_deprovision: [],
        http_method: 'GET', http_endpoint: '/api/v1/users/00uJBR00022/groups', http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 59,
      details: { group: 'it-all', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_it-all/users/00uJBR00022', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 56,
      details: { group: 'okta-admins', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_okta-admins/users/00uJBR00022', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 53,
      details: { group: 'security-team', http_method: 'DELETE', http_endpoint: '/api/v1/groups/grp_security-team/users/00uJBR00022', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 55,
      details: { group: 'eng-all', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_eng-all/users/00uJBR00022', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'move', employee_id: empId,
      action: 'add_group', result: 'success', duration_ms: 58,
      details: { group: 'github-org-members', http_method: 'PUT', http_endpoint: '/api/v1/groups/grp_github-org-members/users/00uJBR00022', http_status: 204 },
    })

    return entries
  })(),

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAVERS (3)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── EMP017 Rachel Kim — Sales Rep (terminated) ──────────────────────────
  ...(() => {
    const eventId = 'evt-rk17lev0-1234-5678-9abc-de0000170017'
    const empId = 'EMP017'
    const oktaId = '00uRKM00017'
    const ts = seqTs('2026-03-23T16:05:02.400000', 9)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'disable_user', result: 'success', duration_ms: 134,
      details: {
        employee_name: 'Rachel Kim', email: 'rachel.kim@example.com',
        department: 'sales', title: 'Sales Rep',
        okta_user_id: oktaId,
        http_method: 'POST', http_endpoint: `/api/v1/users/${oktaId}/lifecycle/deactivate`, http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'revoke_sessions', result: 'success', duration_ms: 78,
      details: { sessions_count: 2, http_method: 'DELETE', http_endpoint: `/api/v1/users/${oktaId}/sessions`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 112,
      details: { app: 'salesforce', http_method: 'DELETE', http_endpoint: '/salesforce/scim/v2/Users/sf_rachel_kim_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 96,
      details: { app: 'slack', http_method: 'DELETE', http_endpoint: '/slack/scim/v2/Users/su_rachel_kim_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 89,
      details: { app: 'zoom', http_method: 'DELETE', http_endpoint: '/zoom/scim/v2/Users/zu_rachel_kim_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 101,
      details: { app: 'hubspot', http_method: 'DELETE', http_endpoint: '/hubspot/scim/v2/Users/hu_rachel_kim_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 55,
      details: { group: 'sales-all', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_sales-all/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 52,
      details: { group: 'crm-users', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_crm-users/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'post_deprovision_audit', result: 'success', duration_ms: 45,
      details: {
        okta_disabled: true,
        sessions_revoked: true,
        apps_deprovisioned: { salesforce: true, slack: true, zoom: true, hubspot: true },
        audit_checks: [
          { check: 'Okta account disabled', result: 'pass' },
          { check: 'All sessions revoked', result: 'pass' },
          { check: 'OAuth tokens invalidated', result: 'pass' },
          { check: 'Salesforce: user not found', result: 'pass' },
          { check: 'Slack: user not found', result: 'pass' },
          { check: 'Zoom: user not found', result: 'pass' },
          { check: 'HubSpot: user not found', result: 'pass' },
        ],
        http_method: 'GET', http_endpoint: `/api/v1/users/${oktaId}`, http_status: 200,
      },
    })

    return entries
  })(),

  // ── EMP018 Tom Bradley — IT Systems Engineer (terminated, privileged, with audit failure + retry)
  ...(() => {
    const eventId = 'evt-tb18lev0-2345-6789-abcd-ef0000180018'
    const empId = 'EMP018'
    const oktaId = '00uTBR00018'
    const ts = seqTs('2026-03-23T17:30:15.100000', 11)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'disable_user', result: 'success', duration_ms: 128,
      details: {
        employee_name: 'Tom Bradley', email: 'tom.bradley@example.com',
        department: 'it', title: 'IT Systems Engineer',
        okta_user_id: oktaId,
        http_method: 'POST', http_endpoint: `/api/v1/users/${oktaId}/lifecycle/deactivate`, http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'revoke_sessions', result: 'success', duration_ms: 95,
      details: { sessions_count: 5, http_method: 'DELETE', http_endpoint: `/api/v1/users/${oktaId}/sessions`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 105,
      details: { app: 'slack', http_method: 'DELETE', http_endpoint: '/slack/scim/v2/Users/su_tom_bradley_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 92,
      details: { app: 'zoom', http_method: 'DELETE', http_endpoint: '/zoom/scim/v2/Users/zu_tom_bradley_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 118,
      details: { app: 'github', http_method: 'DELETE', http_endpoint: '/github/scim/v2/Users/gu_tom_bradley_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 58,
      details: { group: 'it-all', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_it-all/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 54,
      details: { group: 'okta-admins', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_okta-admins/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 51,
      details: { group: 'security-team', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_security-team/users/${oktaId}`, http_status: 204 },
    })
    // Audit FAILS — Slack session still active
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'post_deprovision_audit', result: 'failure', duration_ms: 52,
      details: {
        okta_disabled: true,
        sessions_revoked: true,
        apps_deprovisioned: { slack: true, zoom: true, github: true },
        audit_checks: [
          { check: 'Okta account disabled', result: 'pass' },
          { check: 'All sessions revoked', result: 'pass' },
          { check: 'OAuth tokens invalidated', result: 'pass' },
          { check: 'Slack: active session detected', result: 'fail', detail: 'Session sid_abc123 still active — triggering re-revocation' },
          { check: 'Zoom: user not found', result: 'pass' },
          { check: 'GitHub: user not found', result: 'pass' },
          { check: 'Okta admin privileges revoked', result: 'pass' },
        ],
        http_method: 'GET', http_endpoint: `/api/v1/users/${oktaId}`, http_status: 200,
      },
    })
    // Re-revoke Slack session
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'revoke_sessions', result: 'success', duration_ms: 68,
      details: {
        sessions_count: 1,
        http_method: 'DELETE', http_endpoint: '/slack/scim/v2/Users/su_tom_bradley_001/sessions', http_status: 204,
      },
    })
    // Retry audit — all pass
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'post_deprovision_audit', result: 'success', duration_ms: 48,
      details: {
        okta_disabled: true,
        sessions_revoked: true,
        apps_deprovisioned: { slack: true, zoom: true, github: true },
        retry_count: 1,
        audit_checks: [
          { check: 'Okta account disabled', result: 'pass' },
          { check: 'All sessions revoked', result: 'pass' },
          { check: 'OAuth tokens invalidated', result: 'pass' },
          { check: 'Slack: user not found', result: 'pass' },
          { check: 'Zoom: user not found', result: 'pass' },
          { check: 'GitHub: user not found', result: 'pass' },
          { check: 'Okta admin privileges revoked', result: 'pass' },
        ],
        http_method: 'GET', http_endpoint: `/api/v1/users/${oktaId}`, http_status: 200,
      },
    })

    return entries
  })(),

  // ── EMP024 Alex Torres — Engineering Junior Engineer (terminated, short tenure)
  ...(() => {
    const eventId = 'evt-at24lev0-3456-789a-bcde-f00000240024'
    const empId = 'EMP024'
    const oktaId = '00uATR00024'
    const ts = seqTs('2026-03-24T10:00:08.200000', 8)
    let i = 0
    const entries: EventEntry[] = []

    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'disable_user', result: 'success', duration_ms: 131,
      details: {
        employee_name: 'Alex Torres', email: 'alex.torres@example.com',
        department: 'engineering', title: 'Junior Engineer',
        okta_user_id: oktaId,
        http_method: 'POST', http_endpoint: `/api/v1/users/${oktaId}/lifecycle/deactivate`, http_status: 200,
      },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'revoke_sessions', result: 'success', duration_ms: 65,
      details: { sessions_count: 1, http_method: 'DELETE', http_endpoint: `/api/v1/users/${oktaId}/sessions`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 108,
      details: { app: 'github', http_method: 'DELETE', http_endpoint: '/github/scim/v2/Users/gu_alex_torres_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'success', duration_ms: 94,
      details: { app: 'slack', http_method: 'DELETE', http_endpoint: '/slack/scim/v2/Users/su_alex_torres_001', http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'deprovision_app', result: 'failure', duration_ms: 30000,
      error: 'SCIM request timeout after 30s — Zoom API unresponsive, manual review required',
      details: { app: 'zoom', http_method: 'DELETE', http_endpoint: '/zoom/scim/v2/Users/zu_alex_torres_001', http_status: 504 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 52,
      details: { group: 'eng-all', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_eng-all/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'remove_group', result: 'success', duration_ms: 49,
      details: { group: 'github-org-members', http_method: 'DELETE', http_endpoint: `/api/v1/groups/grp_github-org-members/users/${oktaId}`, http_status: 204 },
    })
    entries.push({
      timestamp: ts[i++], event_id: eventId, event_type: 'leave', employee_id: empId,
      action: 'post_deprovision_audit', result: 'failure', duration_ms: 42,
      details: {
        okta_disabled: true,
        sessions_revoked: true,
        apps_deprovisioned: { github: true, slack: true, zoom: true },
        audit_checks: [
          { check: 'Okta account disabled', result: 'pass' },
          { check: 'All sessions revoked', result: 'pass' },
          { check: 'OAuth tokens invalidated', result: 'pass' },
          { check: 'GitHub: user not found', result: 'pass' },
          { check: 'Slack: user not found', result: 'pass' },
          { check: 'Zoom: deprovision timed out', result: 'fail', detail: 'SCIM DELETE returned 504 — manual review flagged for IT team' },
        ],
        http_method: 'GET', http_endpoint: `/api/v1/users/${oktaId}`, http_status: 200,
      },
    })

    return entries
  })(),
]

export const demoEvents: EventEntry[] = allEvents
