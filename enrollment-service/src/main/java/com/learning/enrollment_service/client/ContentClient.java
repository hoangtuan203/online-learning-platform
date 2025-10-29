package com.learning.enrollment_service.client;

import com.learning.enrollment_service.dto.ContentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "content-service", url = "${app.services.content.url}")
public interface ContentClient {
    @GetMapping("/contents/course/{courseId}")
    List<ContentDTO> getContentsByCourseId(@PathVariable("courseId") Long courseId);
}
