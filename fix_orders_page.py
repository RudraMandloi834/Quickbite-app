import re
with open("frontend/src/app/orders/page.tsx", "r") as f: content = f.read()

bad_fetch_1 = """const [fetchedOrders, restaurants] = await Promise.all([
        getMyOrders(),
        getRestaurants().catch(() => [] as Restaurant[])
      ]);

      // Map restaurant names and sort by newest first (although backend does this, we do it here just in case)
      const enrichedOrders = fetchedOrders.map((order) => {
        const restaurant = restaurants.find((r) => r.id === order.restaurantId);
        return {
          ...order,
          restaurantName: restaurant?.name || "Unknown Restaurant",
        };
      });"""

good_fetch_1 = """const fetchedOrders = await getMyOrders();
      const uniqueRestIds = Array.from(new Set(fetchedOrders.map(o => o.restaurantId)));
      const restResults = await Promise.all(uniqueRestIds.map(id => getRestaurantById(id).catch(()=>null)));
      const restMap = new Map(restResults.filter(Boolean).map(r => [r?.id, r?.name]));
      
      const enrichedOrders = fetchedOrders.map((order) => {
        return {
          ...order,
          restaurantName: restMap.get(order.restaurantId) || "Unknown Restaurant",
        };
      });"""

bad_fetch_2 = """const [fetchedOrders, restaurants] = await Promise.all([
          getMyOrders(),
          getRestaurants().catch(() => [] as Restaurant[])
        ]);

        if (ignore) return;

        const enrichedOrders = fetchedOrders.map((order) => {
          const restaurant = restaurants.find((r) => r.id === order.restaurantId);
          return {
            ...order,
            restaurantName: restaurant?.name || "Unknown Restaurant",
          };
        });"""
good_fetch_2 = """const fetchedOrders = await getMyOrders();
        if (ignore) return;
        const uniqueRestIds = Array.from(new Set(fetchedOrders.map(o => o.restaurantId)));
        const restResults = await Promise.all(uniqueRestIds.map(id => getRestaurantById(id).catch(()=>null)));
        const restMap = new Map(restResults.filter(Boolean).map(r => [r?.id, r?.name]));

        const enrichedOrders = fetchedOrders.map((order) => {
          return {
            ...order,
            restaurantName: restMap.get(order.restaurantId) || "Unknown Restaurant",
          };
        });"""

content = content.replace(bad_fetch_1, good_fetch_1)
content = content.replace(bad_fetch_2, good_fetch_2)
content = content.replace('import { getMyOrders, getRestaurants } from "@/lib/api";', 'import { getMyOrders, getRestaurantById } from "@/lib/api";')
with open("frontend/src/app/orders/page.tsx", "w") as f: f.write(content)
