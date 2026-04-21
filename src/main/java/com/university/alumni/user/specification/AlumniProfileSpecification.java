package com.university.alumni.user.specification;

import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class AlumniProfileSpecification {

    public static Specification<AlumniProfile> withCriteria(
            String query,
            String program,
            Integer year,
            String country,
            String state,
            String city) {

        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter deleted profiles
            predicates.add(cb.isNull(root.get("deletedAt")));

            // Join with User to search by name and email
            Join<AlumniProfile, User> userJoin = root.join("user", JoinType.INNER);
            
            // Ensure user is enabled and not deleted
            predicates.add(cb.isTrue(userJoin.get("enabled")));
            predicates.add(cb.isNull(userJoin.get("deletedAt")));

            // 1. Global Search (Name, Email, Student ID)
            if (StringUtils.hasText(query)) {
                String pattern = "%" + query.toLowerCase() + "%";
                
                // Name (First or Last)
                Predicate firstName = cb.like(cb.lower(userJoin.get("firstName")), pattern);
                Predicate lastName = cb.like(cb.lower(userJoin.get("lastName")), pattern);
                
                // Email
                Predicate email = cb.like(cb.lower(userJoin.get("email")), pattern);
                
                // Student ID
                Predicate studentId = cb.like(cb.lower(root.get("studentId")), pattern);

                predicates.add(cb.or(firstName, lastName, email, studentId));
            }

            // 2. Dropdown Filters
            if (StringUtils.hasText(program)) {
                predicates.add(cb.equal(root.get("program"), program));
            }
            if (year != null) {
                predicates.add(cb.equal(root.get("graduationYear"), year));
            }
            if (StringUtils.hasText(country)) {
                predicates.add(cb.equal(root.get("country"), country));
            }
            if (StringUtils.hasText(state)) {
                predicates.add(cb.equal(root.get("state"), state));
            }
            if (StringUtils.hasText(city)) {
                predicates.add(cb.equal(root.get("city"), city));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
