import re
with open('src/main/java/com/quickbite/restaurant/Restaurant.java', 'r') as f:
    content = f.read()

# Add new fields
new_fields = """
    private Integer reviewCount = 0;
    private Integer priceRange = 1;
    private Boolean deliveryAvailability = true;
    private java.time.Instant updatedAt;

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    
    public Integer getPriceRange() { return priceRange; }
    public void setPriceRange(Integer priceRange) { this.priceRange = priceRange; }
    
    public Boolean getDeliveryAvailability() { return deliveryAvailability; }
    public void setDeliveryAvailability(Boolean deliveryAvailability) { this.deliveryAvailability = deliveryAvailability; }
    
    public java.time.Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.Instant updatedAt) { this.updatedAt = updatedAt; }
"""
content = re.sub(r'(private String coverImageUrl;)', r'\1\n' + new_fields, content)

with open('src/main/java/com/quickbite/restaurant/Restaurant.java', 'w') as f:
    f.write(content)

