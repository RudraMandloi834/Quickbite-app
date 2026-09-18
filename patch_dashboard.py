import re

file_path = "frontend/src/app/restaurant/dashboard/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add invite card right after the restaurant selector header
header_end = content.find('</select>')
if header_end != -1:
    after_select = content.find('</div>', header_end) + 6
    
    invite_card = """
      <div className="bg-white p-4 shadow-sm border border-brand-border/60 rounded-lg mt-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-brand-fg">Invite Co-Owners</h3>
          <p className="text-sm text-brand-muted">Generate a code to allow another user to co-manage.</p>
        </div>
        <div className="flex gap-2 items-center">
          {inviteCode && (
            <span className="font-mono text-brand-secondary font-bold px-3 py-1 bg-brand-secondary/10 rounded border border-brand-secondary/20">
              {inviteCode}
            </span>
          )}
          <button 
            onClick={handleGenerateInvite} 
            disabled={isGenerating}
            className="px-4 py-2 bg-brand-primary text-white rounded font-medium text-sm disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Code"}
          </button>
        </div>
      </div>
"""
    content = content[:after_select] + invite_card + content[after_select:]
    
with open(file_path, "w") as f:
    f.write(content)

