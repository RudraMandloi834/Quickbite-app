const fs = require('fs');
const https = require('https');

const categories = ['Chicken', 'Beef', 'Seafood', 'Dessert', 'Pasta', 'Vegetarian', 'Pork', 'Lamb', 'Side', 'Starter'];
let allUrls = [];

async function fetchCategory(cat) {
  return new Promise((resolve) => {
    https.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.meals) {
            resolve(json.meals.map(m => m.strMealThumb));
          } else resolve([]);
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  for (const cat of categories) {
    const urls = await fetchCategory(cat);
    allUrls = allUrls.concat(urls);
  }
  
  // Deduplicate just in case
  allUrls = Array.from(new Set(allUrls));
  
  // Need 100-200. We can slice 200.
  const slicedUrls = allUrls.slice(0, 200);
  
  const javaCode = `package com.quickbite.restaurant;

import java.util.List;
import java.util.Arrays;

public class ImageConstants {
    
    public static final List<String> RESTAURANT_IMAGES = Arrays.asList(
        ${slicedUrls.map(u => `"${u}"`).join(',\n        ')}
    );

    public static String getRestaurantCover(int index) {
        return RESTAURANT_IMAGES.get(Math.abs(index) % RESTAURANT_IMAGES.size());
    }

    public static String getMenuItemImage(int index) {
        return RESTAURANT_IMAGES.get(Math.abs(index + 50) % RESTAURANT_IMAGES.size());
    }
}
`;
  fs.writeFileSync('src/main/java/com/quickbite/restaurant/ImageConstants.java', javaCode);
  console.log('Successfully wrote ' + slicedUrls.length + ' image URLs.');
}
run();
