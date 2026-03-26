package com.university.alumni.security.service;

import com.university.alumni.common.config.RedisConfig;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Cacheable(value = RedisConfig.CacheNames.USER_DETAILS, key = "#username")
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmailWithRoles(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + username));
        return CachedUserDetails.from(user);
    }
}