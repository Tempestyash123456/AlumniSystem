package com.university.alumni.user.service;

import com.university.alumni.user.dto.AlumniDto;
import com.university.alumni.user.dto.PeerGroupDto;
import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.entity.User;
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
                    return mapToDto(user, profile);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PeerGroupDto> getPeerPrograms() {
        return profileRepository.countByPrograms();
    }

    @Transactional(readOnly = true)
    public List<PeerGroupDto> getPeerGraduationYears(String program) {
        return profileRepository.countByGraduationYears(program);
    }

    @Transactional(readOnly = true)
    public List<PeerGroupDto> getPeerCountries(String program, Integer year) {
        return profileRepository.countByCountries(program, year);
    }

    @Transactional(readOnly = true)
    public List<PeerGroupDto> getPeerStates(String program, Integer year, String country) {
        return profileRepository.countByStates(program, year, country);
    }

    @Transactional(readOnly = true)
    public List<PeerGroupDto> getPeerCities(String program, Integer year, String country, String state) {
        return profileRepository.countByCities(program, year, country, state);
    }

    @Transactional(readOnly = true)
    public List<AlumniDto> getPeers(String program, Integer year, String country, String state, String city) {
        return profileRepository.findPeers(program, year, country, state, city).stream()
                .map(profile -> mapToDto(profile.getUser(), profile))
                .collect(Collectors.toList());
    }

    private AlumniDto mapToDto(User user, AlumniProfile profile) {
        return new AlumniDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfilePhotoUrl(),
                profile != null ? profile.getAdmissionYear() : null,
                profile != null ? profile.getGraduationYear() : null,
                user.getPhone(),
                profile != null ? profile.getProgram() : null,
                profile != null ? profile.getCountry() : null,
                profile != null ? profile.getState() : null,
                profile != null ? profile.getCity() : null,
                profile != null ? profile.getCurrentJobTitle() : null,
                profile != null ? profile.getCurrentCompany() : null,
                profile != null ? profile.getLinkedinUrl() : null
        );
    }
}