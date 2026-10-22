import json

with open('final_unsplash.txt', 'r') as f:
    urls = [line.strip() for line in f if line.strip()]

urls_str = ",\n        ".join(f'"{url}"' for url in urls)

java_code = f"""package com.quickbite.restaurant;

public class ImageConstants {{
    public static final String[] RESTAURANT_IMAGES = {{
        {urls_str}
    }};

    public static final String[] MENU_IMAGES = {{
        {urls_str}
    }};
}}
"""

with open('src/main/java/com/quickbite/restaurant/ImageConstants.java', 'w') as f:
    f.write(java_code)

