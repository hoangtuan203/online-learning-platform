package com.learning.course_service.graphql;

import com.learning.course_service.dto.CoursePage;
import com.learning.course_service.dto.CreateCourseRequest;
import com.learning.course_service.entity.Course;
import com.learning.course_service.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class CourseGraphQLController {

    @Autowired
    private CourseService courseService;

    @QueryMapping
    public CoursePage findAllCourses(@Argument Integer page, @Argument Integer size) {
        return courseService.findAllCourses(page != null ? page : 0, size != null ? size : 5);
    }
    @QueryMapping
    public List<Course> searchCourses(@Argument String title) {
        return courseService.searchCourses(title);
    }

    @QueryMapping
    public Course getCourseById(@Argument Long id) {
        return courseService.getCourseById(id);
    }

    @QueryMapping
    public List<Course> instructorCourses(@Argument Long instructorId) {
        return courseService.findCoursesByInstructor(instructorId);
    }
}