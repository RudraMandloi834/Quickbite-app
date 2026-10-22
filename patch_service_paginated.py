import re

with open('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'r') as f:
    content = f.read()

old_func = r"""public Page<Restaurant> getRestaurantsPaginated\(String search, String cuisine, String city, Pageable pageable\) \{.*?return restaurantRepository\.findAll\(spec, pageable\);\s*\}"""

new_func = """public Page<Restaurant> getRestaurantsPaginated(String search, String cuisine, String city, String locality, Double minRating, Integer priceRange, Pageable pageable) {
        Specification<Restaurant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.or(
                cb.isNull(root.get("status")),
                cb.equal(root.get("status"), RestaurantStatus.APPROVED)
            ));

            if (search != null && !search.isBlank()) {
                String searchLower = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), searchLower),
                    cb.like(cb.lower(root.get("cuisine")), searchLower)
                ));
            }

            if (cuisine != null && !cuisine.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("cuisine")), cuisine.toLowerCase()));
            }

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.toLowerCase()));
            }
            
            if (locality != null && !locality.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("area")), locality.toLowerCase()));
            }
            
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }
            
            if (priceRange != null) {
                predicates.add(cb.equal(root.get("priceRange"), priceRange));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return restaurantRepository.findAll(spec, pageable);
    }"""

content = re.sub(old_func, new_func, content, flags=re.DOTALL)

with open('src/main/java/com/quickbite/restaurant/RestaurantService.java', 'w') as f:
    f.write(content)
