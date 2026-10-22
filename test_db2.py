import urllib.request
import json
import sqlite3

# wait, it's H2 database. Python cannot easily read H2 file directly without jdbc.
# Let's use a small java program to connect to JDBC and run the query!
