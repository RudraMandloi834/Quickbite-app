const fs = require('fs');
const https = require('https');

async function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'unsplash.com',
      path: `/napi/topics/food-drink/photos?page=${page}&per_page=30`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.map(item => item.urls.raw.split('?')[0] + '?w=800&q=80&fit=crop&ar=4:3'));
        } catch (e) {
          console.log('Error parsing JSON for page', page);
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  let allUrls = new Set();
  let page = 1;
  while (allUrls.size < 150 && page <= 8) {
    const urls = await fetchPage(page);
    urls.forEach(u => allUrls.add(u));
    page++;
  }
  
  const urlsArray = Array.from(allUrls).slice(0, 150);
  
  const javaCode = `package com.quickbite.restaurant;

import java.util.List;
import java.util.Arrays;

public class ImageConstants {
    
    public static final List<String> RESTAURANT_IMAGES = Arrays.asList(
        ${urlsArray.map(u => `"${u}"`).join(',\n        ')}
    );

    public static String getRestaurantCover(int index) {
        return RESTAURANT_IMAGES.get(index % RESTAURANT_IMAGES.size());
    }

    public static String getMenuItemImage(int index) {
        return RESTAURANT_IMAGES.get((index + 50) % RESTAURANT_IMAGES.size());
    }
}
`;

  fs.writeFileSync('src/main/java/com/quickbite/restaurant/ImageConstants.java', javaCode);
  console.log('Successfully wrote ' + urlsArray.length + ' image URLs.');
}

run();
