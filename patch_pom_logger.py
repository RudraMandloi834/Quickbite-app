with open("pom.xml", "r") as f: content = f.read()

deps = """
        <dependency>
            <groupId>net.logstash.logback</groupId>
            <artifactId>logstash-logback-encoder</artifactId>
            <version>7.4</version>
        </dependency>
"""
content = content.replace("</dependencies>", deps + "\n    </dependencies>")
with open("pom.xml", "w") as f: f.write(content)
