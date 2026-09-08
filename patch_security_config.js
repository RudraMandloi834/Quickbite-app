const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/security/SecurityConfig.java', 'utf8');

if (!code.includes('OAuth2AuthenticationSuccessHandler')) {
    code = code.replace(/public SecurityConfig\(/, `private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    
    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, AuthenticationProvider authenticationProvider, OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
    }
    
    // replaced`);
    code = code.replace(/\/\/ replaced[\s\S]*?this\.authenticationProvider = authenticationProvider;\n    \}/, '');

    code = code.replace(/\.addFilterBefore\(jwtAuthFilter, UsernamePasswordAuthenticationFilter\.class\);/, `.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2AuthenticationSuccessHandler)
            );`);
            
    fs.writeFileSync('src/main/java/com/quickbite/security/SecurityConfig.java', code);
}
