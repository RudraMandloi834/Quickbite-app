import re

file_path = "frontend/src/app/restaurant/join/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add joinWithCode to imports
content = content.replace("requestStaffAccess, ApiError", "requestStaffAccess, joinWithCode, ApiError")

# Add state
content = content.replace("const [submittingId, setSubmittingId] = useState<number | null>(null);", """const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoiningWithCode, setIsJoiningWithCode] = useState(false);""")

# Add handleJoinWithCode
handle_code = """
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setIsJoiningWithCode(true);
    setError(null);
    try {
      await joinWithCode(inviteCode.trim());
      router.push("/restaurant/onboarding-status");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("You already have a pending or approved join request for this restaurant.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to join via code.");
      }
      setIsJoiningWithCode(false);
    }
  };
"""
content = content.replace("const handleJoin = async", handle_code + "\n  const handleJoin = async")

# Add to JSX before Card
code_card = """
      <Card className="mb-8 p-4 sm:p-6 bg-brand-secondary/5 shadow-xs border-brand-secondary/20">
        <h2 className="text-xl font-serif font-semibold text-brand-fg mb-2">Have an Invitation Code?</h2>
        <p className="text-brand-muted text-sm mb-4">
          Enter an invitation code to request co-owner or manager access to an existing restaurant.
        </p>
        <form onSubmit={handleJoinWithCode} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 font-mono"
            placeholder="e.g. A1B2C3D4"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <Button variant="primary" type="submit" disabled={isJoiningWithCode || !inviteCode.trim()}>
            {isJoiningWithCode ? "Joining..." : "Join"}
          </Button>
        </form>
      </Card>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-brand-border"></div>
        <div className="text-brand-muted text-sm font-medium uppercase tracking-wider">OR FIND A RESTAURANT</div>
        <div className="flex-1 h-px bg-brand-border"></div>
      </div>
"""
content = content.replace('<Card className="mb-8 p-4 sm:p-6 bg-white shadow-xs border-brand-border/60">', code_card + '\n      <Card className="mb-8 p-4 sm:p-6 bg-white shadow-xs border-brand-border/60">')

with open(file_path, "w") as f:
    f.write(content)

