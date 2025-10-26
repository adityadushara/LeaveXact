export default function AdminPoliciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leave Policies</h1>
        <p className="text-sm text-muted-foreground">Configure company-wide leave rules and entitlements.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Annual Leave</h2>
          <p className="text-sm text-muted-foreground">Default allowance: 15 days</p>
        </div>
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Sick Leave</h2>
          <p className="text-sm text-muted-foreground">Default allowance: 10 days</p>
        </div>
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Carry Over</h2>
          <p className="text-sm text-muted-foreground">Up to 5 days may carry to next year.</p>
        </div>
        <div className="rounded-lg border p-6 bg-card">
          <h2 className="text-lg font-medium mb-2">Blackout Dates</h2>
          <p className="text-sm text-muted-foreground">Configure peak business periods where leave is restricted.</p>
        </div>
      </div>
    </div>
  )
}


