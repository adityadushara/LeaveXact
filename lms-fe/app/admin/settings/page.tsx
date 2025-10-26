export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Branding, notifications, and approval workflows.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Branding</h2>
          <p className="text-sm text-muted-foreground">Logo and theme color selection.</p>
        </div>
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Notifications</h2>
          <p className="text-sm text-muted-foreground">Email alerts on requests and approvals.</p>
        </div>
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Approval Workflow</h2>
          <p className="text-sm text-muted-foreground">Single or multi-level approvers.</p>
        </div>
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Working Days</h2>
          <p className="text-sm text-muted-foreground">Define weekends and public holidays.</p>
        </div>
      </div>
    </div>
  )
}


