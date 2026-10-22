import re

with open("pom.xml", "r") as f:
    content = f.read()

deps_to_add = """
        <!-- Production Hardening Dependencies -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-core</artifactId>
            <version>8.1.0</version>
        </dependency>
"""

# Insert before </dependencies>
content = content.replace("</dependencies>", deps_to_add + "\n    </dependencies>")

with open("pom.xml", "w") as f:
    f.write(content)
