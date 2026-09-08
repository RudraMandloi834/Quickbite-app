import { Delivery } from "@/types/delivery";

const STAGES = [
  "ASSIGNING",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const STAGE_LABELS: Record<string, { title: string; desc: string }> = {
  ASSIGNING: { title: "Finding a Partner", desc: "Looking for a nearby delivery executive." },
  ASSIGNED: { title: "Partner Assigned", desc: "A delivery executive is on the way to the restaurant." },
  PICKED_UP: { title: "Order Picked Up", desc: "Your food has been picked up from the restaurant." },
  OUT_FOR_DELIVERY: { title: "Out for Delivery", desc: "Your food is on the way to your address." },
  DELIVERED: { title: "Delivered", desc: "Enjoy your meal!" },
};

export function DeliveryTracker({ delivery }: { delivery: Delivery | null }) {
  if (!delivery) {
    return (
      <div className="p-6 bg-white shadow-xs rounded-2xl border border-brand-border/40">
        <h2 className="font-serif text-xl font-medium text-brand-fg mb-2">Preparing Delivery</h2>
        <p className="text-sm text-brand-muted">Your order is confirmed. We will assign a delivery partner shortly.</p>
        <div className="mt-4 animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-brand-primary/60 rounded-full"></div>
          <div className="h-2 w-2 bg-brand-primary/60 rounded-full animation-delay-200"></div>
          <div className="h-2 w-2 bg-brand-primary/60 rounded-full animation-delay-400"></div>
        </div>
      </div>
    );
  }

  if (delivery.status === "CANCELLED") {
    return (
      <div className="p-6 bg-white shadow-xs rounded-2xl border border-brand-border/40">
        <h2 className="font-serif text-xl font-medium text-brand-fg mb-2">Delivery Cancelled</h2>
        <p className="text-sm text-brand-muted">Unfortunately, this delivery was cancelled.</p>
      </div>
    );
  }

  const currentIdx = STAGES.indexOf(delivery.status);

  return (
    <div className="p-6 sm:p-8 bg-white shadow-xs rounded-2xl border border-brand-border/40">
      <h2 className="font-serif text-xl font-medium text-brand-fg mb-6 pb-4 border-b border-brand-border">
        Delivery Tracking
      </h2>

      <div className="relative pl-3">
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-brand-border/40 rounded-full" />
        
        <div className="space-y-8 relative">
          {STAGES.map((stage, idx) => {
            const isCompleted = currentIdx > idx;
            const isCurrent = currentIdx === idx;
            const isUpcoming = currentIdx < idx;
            
            const labels = STAGE_LABELS[stage];

            let dotClasses = "w-3 h-3 rounded-full border-2 bg-white";
            if (isCompleted) {
              dotClasses = "w-3 h-3 rounded-full bg-emerald-500 border-emerald-500";
            } else if (isCurrent) {
              dotClasses = "w-4 h-4 rounded-full bg-white border-[4px] border-brand-primary -ml-0.5";
            } else {
              dotClasses = "w-3 h-3 rounded-full bg-white border-brand-border/80";
            }

            return (
              <div key={stage} className={`flex items-start gap-5 ${isUpcoming ? "opacity-50" : ""}`}>
                <div className="relative z-10 flex items-center justify-center pt-1 w-5">
                  <div className={dotClasses} />
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${isCurrent ? "text-brand-fg" : "text-brand-fg/80"}`}>
                    {labels.title}
                  </h4>
                  <p className="text-xs text-brand-muted mt-1">{labels.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentIdx >= STAGES.indexOf("ASSIGNED") && delivery.driverName && (
        <div className="mt-8 pt-6 border-t border-brand-border/60">
          <p className="text-xs text-brand-muted mb-3 uppercase tracking-wider font-semibold">Delivery Executive</p>
          <div className="flex items-center gap-4 bg-brand-bg/50 p-4 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-brand-border/50 flex items-center justify-center text-brand-fg font-medium">
              {delivery.driverName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-brand-fg">{delivery.driverName}</p>
              <p className="text-xs text-brand-muted mt-0.5">{delivery.driverPhone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
