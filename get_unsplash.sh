for query in "restaurant" "food" "pizza" "burger" "indian-food" "sushi" "cafe" "dining"; do
    curl -s "https://unsplash.com/s/photos/$query" | grep -o 'https://images.unsplash.com/photo-[a-zA-Z0-9-]*' | sort | uniq
done
