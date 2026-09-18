#!/bin/bash
sed -i '/<groupId>com.h2database<\/groupId>/{N;N;N;d;}' pom.xml
