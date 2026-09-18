import re

file_path = "frontend/src/app/restaurant/dashboard/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

handlers = """
  const handleGenerateInvite = async () => {
    if (!selectedRestaurantId) return;
    setIsGenerating(true);
    setInviteCode(null);
    try {
      const res = await createInvitation(selectedRestaurantId);
      setInviteCode(res.code);
    } catch (err) {
      alert("Failed to generate invitation code.");
    } finally {
      setIsGenerating(false);
    }
  };

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
content = content.replace("const handleUpdateOrderStatus = async", handlers + "\n  const handleUpdateOrderStatus = async")

with open(file_path, "w") as f:
    f.write(content)

