with open("src/main/java/com/quickbite/restaurant/RestaurantService.java", "r") as f:
    content = f.read()

imports = """
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
"""

content = content.replace("package com.quickbite.restaurant;", "package com.quickbite.restaurant;\n" + imports)

with open("src/main/java/com/quickbite/restaurant/RestaurantService.java", "w") as f:
    f.write(content)
