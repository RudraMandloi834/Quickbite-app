with open("src/main/java/com/quickbite/event/SseService.java", "r") as f: content = f.read()

method = """
    public int getActiveClientCount() {
        int count = adminEmitters.size();
        for (List<SseEmitter> list : customerEmitters.values()) count += list.size();
        for (List<SseEmitter> list : restaurantEmitters.values()) count += list.size();
        for (List<SseEmitter> list : driverEmitters.values()) count += list.size();
        return count;
    }
"""

content = content.replace("public SseEmitter subscribe(Long userId, String role) {", method + "\n    public SseEmitter subscribe(Long userId, String role) {")
with open("src/main/java/com/quickbite/event/SseService.java", "w") as f: f.write(content)
