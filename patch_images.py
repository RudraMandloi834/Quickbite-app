import re

with open('src/main/java/com/quickbite/IndianRestaurantData.java', 'r') as f:
    content = f.read()

images = []
for i in range(1, 151):
    images.append(f'"https://loremflickr.com/800/600/restaurant,food?random={i}"')

images_str = ",\n        ".join(images)

content = re.sub(
    r'public static final String\[\] IMAGES = \{.*?\};',
    f'public static final String[] IMAGES = {{\n        {images_str}\n    }};',
    content,
    flags=re.DOTALL
)

with open('src/main/java/com/quickbite/IndianRestaurantData.java', 'w') as f:
    f.write(content)
