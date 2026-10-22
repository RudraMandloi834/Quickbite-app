with open("frontend/src/app/restaurants/page.tsx", "r") as f:
    text = f.read()

text = text.replace("restaurant: any // eslint-disable-line @typescript-eslint/no-explicit-any", "restaurant: any")

with open("frontend/src/app/restaurants/page.tsx", "w") as f:
    f.write(text)
