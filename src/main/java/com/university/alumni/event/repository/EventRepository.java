package com.university.alumni.event.repository;

import com.university.alumni.event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query("SELECT e FROM Event e JOIN FETCH e.author WHERE e.deletedAt IS NULL ORDER BY e.startTime ASC")
    List<Event> findAllActive();
}