package com.learning.enrollment_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LikeResponse {
    private boolean liked;
    private int likeCount;
}