package com.quickbite.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RestaurantInvitationRepository extends JpaRepository<RestaurantInvitation, Long> {
    Optional<RestaurantInvitation> findByCode(String code);
}
