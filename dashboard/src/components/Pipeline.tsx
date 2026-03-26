const APPS = [
  { name: 'Slack', color: '#e01e5a' },
  { name: 'GitHub', color: '#f0f6fc' },
  { name: 'Zoom', color: '#2d8cff' },
  { name: 'GWS', color: '#4285f4' },
  { name: 'Figma', color: '#a259ff' },
  { name: 'Salesforce', color: '#00a1e0' },
  { name: 'HubSpot', color: '#ff7a59' },
  { name: 'Rippling', color: '#fbbf24' },
  { name: 'NetSuite', color: '#8bc34a' },
]

export default function Pipeline() {
  return (
    <div className="flex items-center gap-0 px-4 py-2 overflow-x-auto text-[10px]">
      {/* HRIS */}
      <Node label="HRIS" sub="Sapling" color="#22c55e" />
      <Connector />
      {/* Okta */}
      <Node label="Okta" sub="Workflows" color="#fbbf24" />
      <Connector />
      {/* SCIM */}
      <Node label="SCIM" sub="Provisioner" color="#fbbf24" />
      <Connector />
      {/* Apps */}
      <div className="flex items-center gap-1.5">
        {APPS.map((app) => (
          <div key={app.name} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-gray-400 whitespace-nowrap" style={{ fontSize: '9px' }}>{app.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Node({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border shrink-0"
      style={{ borderColor: `${color}33`, background: `${color}08` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="leading-none">
        <span className="font-semibold text-gray-200" style={{ fontSize: '10px' }}>{label}</span>
        <span className="text-gray-500 ml-1" style={{ fontSize: '9px' }}>{sub}</span>
      </div>
    </div>
  )
}

function Connector() {
  return (
    <div className="pipeline-line w-6 h-px bg-gray-700 mx-0.5 shrink-0" />
  )
}
