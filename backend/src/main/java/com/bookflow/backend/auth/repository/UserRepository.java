package com.bookflow.backend.auth.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.model.UserRole;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findAllByRole(UserRole role);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(UserRole role);
}
