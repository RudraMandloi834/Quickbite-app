import re

file_path = "frontend/src/app/restaurant/onboarding-status/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add getMyJoinRequests to imports
content = content.replace("getMyApplications, getMyStaffRequests", "getMyApplications, getMyStaffRequests, getMyJoinRequests, RestaurantJoinRequest")

# Add state
content = content.replace("const [staffRequests, setStaffRequests] = useState<RestaurantStaffProfile[]>([]);", """const [staffRequests, setStaffRequests] = useState<RestaurantStaffProfile[]>([]);
  const [joinRequests, setJoinRequests] = useState<RestaurantJoinRequest[]>([]);""")

# Add to Promise.all
content = content.replace("""const [apps, requests] = await Promise.all([
          getMyApplications(),
          getMyStaffRequests()
        ]);""", """const [apps, requests, joins] = await Promise.all([
          getMyApplications(),
          getMyStaffRequests(),
          getMyJoinRequests()
        ]);""")

# Set state
content = content.replace("setStaffRequests(requests);", """setStaffRequests(requests);
          setJoinRequests(joins);""")

# Add section in JSX
section_join = """
        {/* Owner Join Requests Section */}
        <section>
          <h2 className="text-2xl font-serif text-brand-fg mb-4">Existing Restaurant Join Requests</h2>
          {joinRequests.length === 0 ? (
            <Card className="p-8 text-center bg-brand-bg border-brand-border/60 border-dashed">
              <p className="text-brand-muted mb-4">You have no pending join requests via invitation codes.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((req) => (
                <Card key={req.id} className="p-6 bg-white shadow-xs">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-brand-fg">Restaurant ID: {req.restaurantId}</h3>
                      <p className="text-brand-muted text-sm mt-1">
                        Requested on: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={req.status === 'APPROVED' ? 'success' : req.status === 'PENDING_APPROVAL' ? 'warning' : 'error'}>
                      Join Status: {req.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
"""

content = content.replace("{/* Staff Requests Section */}", section_join + "\n        {/* Staff Requests Section */}")

with open(file_path, "w") as f:
    f.write(content)

