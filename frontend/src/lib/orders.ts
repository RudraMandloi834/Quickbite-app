export function getStoredOrderIds(): number[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("quickbite_order_ids");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addStoredOrderId(orderId: number) {
  if (typeof window === "undefined") return;
  const ids = getStoredOrderIds();
  if (!ids.includes(orderId)) {
    ids.push(orderId);
    localStorage.setItem("quickbite_order_ids", JSON.stringify(ids));
  }
}
