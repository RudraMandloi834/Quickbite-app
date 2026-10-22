with open("src/main/java/com/quickbite/event/SseService.java", "r") as f: content = f.read()
if "getActiveClientCount" not in content:
    content = content.replace("public SseEmitter connect(", "public int getActiveClientCount() { return emitters.size(); }\n\n    public SseEmitter connect(")
    with open("src/main/java/com/quickbite/event/SseService.java", "w") as f: f.write(content)
