with open("src/main/java/com/quickbite/security/SecurityConfig.java", "r") as f: content = f.read()

import_str = "import org.springframework.web.cors.CorsConfigurationSource;\nimport org.springframework.web.cors.UrlBasedCorsConfigurationSource;\nimport org.springframework.web.cors.CorsConfiguration;\nimport java.util.Arrays;"

if "UrlBasedCorsConfigurationSource" not in content:
    content = content.replace("import org.springframework.security.web.SecurityFilterChain;", "import org.springframework.security.web.SecurityFilterChain;\n" + import_str)
    
    # Check if there is an existing cors config
    if "CorsConfigurationSource corsConfigurationSource()" not in content:
        cors_bean = """
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "https://quickbite.production.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
"""
        content = content.replace("public class SecurityConfig {", "public class SecurityConfig {\n" + cors_bean)
        
    with open("src/main/java/com/quickbite/security/SecurityConfig.java", "w") as f: f.write(content)

