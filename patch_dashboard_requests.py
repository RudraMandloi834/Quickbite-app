import re

file_path = "frontend/src/app/restaurant/dashboard/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add getJoinRequestsForRestaurant, approveJoinRequest, rejectJoinRequest to imports
content = content.replace("createInvitation, authFetch, getApiBaseUrl }", "createInvitation, authFetch, getApiBaseUrl, getJoinRequestsForRestaurant, approveJoinRequest, rejectJoinRequest, RestaurantJoinRequest }")

# Add state
content = content.replace("const [menuItems, setMenuItems] = useState<MenuItem[]>([]);", """const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<RestaurantJoinRequest[]>([]);""")

# Add to Promise.all
content = content.replace("""authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`)
      ]);""", """authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`),
        getJoinRequestsForRestaurant(id).catch(() => [] as RestaurantJoinRequest[])
      ]);""")

# Set state
content = content.replace("if (menuRes.ok) {", """setJoinRequests(arguments[0][3] || []);
      if (menuRes.ok) {""")

# We used arguments[0][3] because we don't know the exact var name, but wait, let's just properly map it.
# The Promise.all array assigns to `[sumData, ordData, menuRes]`
# Let's replace the whole loadDashboardData block
load_block_old = """const [sumData, ordData, menuRes] = await Promise.all([
        getRestaurantDashboardSummary(id),
        getRestaurantOrders(id),
        authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`)
      ]);
      
      setSummary(sumData);
      setOrders(ordData);
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }"""
load_block_new = """const [sumData, ordData, menuRes, joinsData] = await Promise.all([
        getRestaurantDashboardSummary(id),
        getRestaurantOrders(id),
        authFetch(`${getApiBaseUrl()}/api/restaurants/${id}/menu`),
        getJoinRequestsForRestaurant(id).catch(() => [] as RestaurantJoinRequest[])
      ]);
      
      setSummary(sumData);
      setOrders(ordData);
      setJoinRequests(joinsData);
      if (menuRes.ok) {
        setMenuItems(await menuRes.json());
      }"""
content = content.replace(load_block_old, load_block_new)

# Add Handle Approve/Reject
handlers = """
  const handleApproveJoin = async (reqId: number) => {
    try {
      await approveJoinRequest(reqId);
      setJoinRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r));
    } catch {
      alert("Failed to approve");
    }
  };
  const handleRejectJoin = async (reqId: number) => {
    try {
      await rejectJoinRequest(reqId);
      setJoinRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r));
    } catch {
      alert("Failed to reject");
    }
  };
"""
content = content.replace("const handleMenuDelete = async", handlers + "\n  const handleMenuDelete = async")

# Add to JSX (right below the Invite Card)
invite_card_end = content.find('</button>\n        </div>\n      </div>')
if invite_card_end != -1:
    idx = content.find('</div>', invite_card_end + 10) + 7
    
    requests_ui = """
      {joinRequests.filter(r => r.status === 'PENDING_APPROVAL').length > 0 && (
        <div className="bg-white p-4 shadow-sm border border-brand-border/60 rounded-lg mt-4">
          <h3 className="font-medium text-brand-fg mb-3">Pending Join Requests</h3>
          <div className="space-y-3">
            {joinRequests.filter(r => r.status === 'PENDING_APPROVAL').map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-brand-bg rounded border border-brand-border/40">
                <div>
                  <p className="text-sm font-medium text-brand-fg">User ID: {req.userId}</p>
                  <p className="text-xs text-brand-muted">Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveJoin(req.id)} className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700">Approve</button>
                  <button onClick={() => handleRejectJoin(req.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
"""
    content = content[:idx] + requests_ui + content[idx:]

with open(file_path, "w") as f:
    f.write(content)

