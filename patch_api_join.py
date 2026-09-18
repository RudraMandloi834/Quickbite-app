import re

file_path = "frontend/src/lib/api.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add to api.ts
join_req_api = """
export interface RestaurantJoinRequest {
  id: number;
  restaurantId: number;
  userId: number;
  status: string;
  createdAt: string;
}

export async function joinWithCode(code: string): Promise<RestaurantJoinRequest> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/join-with-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new ApiError(`Failed to join: ${errorText}`, res.status);
  }
  return res.json();
}

export async function getMyJoinRequests(): Promise<RestaurantJoinRequest[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/my-join-requests`);
  if (!res.ok) throw new ApiError(`Failed to fetch join requests`, res.status);
  return res.json();
}

export async function getJoinRequestsForRestaurant(restaurantId: number): Promise<RestaurantJoinRequest[]> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/join-requests`);
  if (!res.ok) throw new ApiError(`Failed to fetch join requests`, res.status);
  return res.json();
}

export async function createInvitation(restaurantId: number): Promise<{ code: string }> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/invitations`, {
    method: "POST"
  });
  if (!res.ok) throw new ApiError(`Failed to create invitation`, res.status);
  return res.json();
}

export async function approveJoinRequest(requestId: number): Promise<RestaurantJoinRequest> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/join-requests/${requestId}/approve`, {
    method: "POST"
  });
  if (!res.ok) throw new ApiError(`Failed to approve`, res.status);
  return res.json();
}

export async function rejectJoinRequest(requestId: number): Promise<RestaurantJoinRequest> {
  const res = await authFetch(`${getApiBaseUrl()}/api/restaurants/join-requests/${requestId}/reject`, {
    method: "POST"
  });
  if (!res.ok) throw new ApiError(`Failed to reject`, res.status);
  return res.json();
}
"""

if "export interface RestaurantJoinRequest" not in content:
    content += "\n" + join_req_api
    with open(file_path, "w") as f:
        f.write(content)

