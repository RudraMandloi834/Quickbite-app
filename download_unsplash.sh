rm -f urls.txt
for i in {1..8}; do
  curl -s "https://unsplash.com/napi/topics/food-drink/photos?page=$i&per_page=30" | grep -o 'https://images.unsplash.com/photo-[^?]*' | grep -v 'profile' | grep -v 'collection' >> urls.txt
  curl -s "https://unsplash.com/napi/topics/food-drink/photos?page=$i&per_page=30" | grep -o 'https://plus.unsplash.com/premium_photo-[^?]*' >> urls.txt
done
sort -u urls.txt > unique_urls.txt
cat unique_urls.txt | wc -l
