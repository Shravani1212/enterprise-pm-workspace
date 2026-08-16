package com.projectpulse.pm.modules.collaboration.repository;

import com.projectpulse.pm.modules.collaboration.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.task.id = :taskId AND c.deletedAt IS NULL ORDER BY c.createdAt ASC")
    List<Comment> findActiveByTaskIdWithUser(@Param("taskId") Long taskId);
}
