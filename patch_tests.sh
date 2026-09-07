#!/bin/bash
for file in src/test/java/com/quickbite/order/OrderServiceTest.java src/test/java/com/quickbite/payment/PaymentServiceTest.java; do
  sed -i '/import org.junit.jupiter.api.BeforeEach;/a \
import org.springframework.security.core.context.SecurityContextHolder;\
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;\
import com.quickbite.security.CustomUserDetails;\
import java.util.Collections;' $file

  sed -i '/@BeforeEach/a \
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(\
            new CustomUserDetails("test@test.com", "pass", Collections.emptyList(), 1L), null));' $file
done
