import re

with open('unsplash_urls.txt', 'r') as f:
    urls = [line.strip() + "?auto=format&fit=crop&w=800&q=80" for line in f if line.strip()]

url_strings = [f'"{url}"' for url in urls]
images_str = ",\n        ".join(url_strings)

with open('src/main/java/com/quickbite/restaurant/ImageConstants.java', 'r') as f:
    content = f.read()

content = re.sub(
    r'public static final String\[\] RESTAURANT_IMAGES = \{.*?\};',
    f'public static final String[] RESTAURANT_IMAGES = {{\n        {images_str}\n    }};',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'public static final String\[\] MENU_IMAGES = \{.*?\};',
    f'public static final String[] MENU_IMAGES = {{\n        {images_str}\n    }};',
    content,
    flags=re.DOTALL
)

with open('src/main/java/com/quickbite/restaurant/ImageConstants.java', 'w') as f:
    f.write(content)
