package com.university.alumni.user.service;

import com.university.alumni.user.dto.AlumniDto;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlumniService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AlumniDto> getAllVerifiedAlumni() {
        // Fetch all enabled users and map them to our safe DTO (so we don't expose passwords!)
        return userRepository.findAll().stream()
                .filter(user -> user.isEnabled() && user.getDeletedAt() == null)
                .map(user -> new AlumniDto(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getProfilePhotoUrl()
                ))
                .collect(Collectors.toList());
    }
}