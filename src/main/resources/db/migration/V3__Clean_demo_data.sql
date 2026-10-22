DELETE FROM menu_item WHERE restaurant_id IN (SELECT id FROM restaurant WHERE city IN ('New York', 'San Francisco', 'Austin', 'Chicago', 'Seattle'));
DELETE FROM restaurant WHERE city IN ('New York', 'San Francisco', 'Austin', 'Chicago', 'Seattle');
