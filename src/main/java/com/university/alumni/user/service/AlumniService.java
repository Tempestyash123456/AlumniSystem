package com.university.alumni.user.service;

import com.university.alumni.user.dto.AlumniDto;
import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.repository.AlumniProfileRepository;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlumniService {

    private final UserRepository          userRepository;
    private final AlumniProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public List<AlumniDto> getAllVerifiedAlumni() {
        // Fetch profiles once to join manually in memory for this simple list
        var profiles = profileRepository.findAll().stream()
                .filter(p -> p.getUser() != null && p.getDeletedAt() == null)
                .collect(Collectors.toMap(
                        p -> p.getUser().getId(),
                        p -> p,
                        (existing, replacement) -> existing));

        return userRepository.findAll().stream()
                .filter(user -> user.isEnabled() && user.getDeletedAt() == null)
                .map(user -> {
                    AlumniProfile profile = profiles.get(user.getId());
                    return new AlumniDto(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getProfilePhotoUrl(),
                        profile != null ? profile.getAdmissionYear() : null,
                        profile != null ? profile.getGraduationYear() : null
                    );
                })
                .collect(Collectors.toList());
    }
}