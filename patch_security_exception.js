const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/security/SecurityConfig.java', 'utf8');

if (!code.includes('HttpStatusEntryPoint')) {
    code = code.replace(/import org\.springframework\.security\.config\.annotation\.web\.configurers\.AbstractHttpConfigurer;/, `import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;`);

    code = code.replace(/\.oauth2Login\(oauth2 -> oauth2\n\s*\.successHandler\(oAuth2AuthenticationSuccessHandler\)\n\s*\);/, `.oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2AuthenticationSuccessHandler)
            )
            .exceptionHandling(e -> e
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            );`);
    fs.writeFileSync('src/main/java/com/quickbite/security/SecurityConfig.java', code);
}
