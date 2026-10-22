const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');

// Replace the useSSE call to extract connectionStatus
code = code.replace(
  'useSSE(getToken(), (event) => {',
  'const { connectionStatus } = useSSE(getToken(), (event) => {'
);

// Inject a small banner for connection status
const bannerUI = `
        {/* Connection Status Banner */}
        {connectionStatus !== "Connected" && (
          <div className={\`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium \${connectionStatus === "Connecting" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}\`}>
            {connectionStatus === "Connecting" ? (
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <div>
              <p className="font-bold">{connectionStatus === "Connecting" ? "Connecting for live updates..." : "Live updates disconnected"}</p>
              <p className="opacity-90">{connectionStatus === "Connecting" ? "You'll see real-time status changes soon." : "Refresh the page to see the latest status."}</p>
            </div>
          </div>
        )}
        
        {/* Main tracking card */}`;

code = code.replace('{/* Main tracking card */}', bannerUI);

fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', code);
