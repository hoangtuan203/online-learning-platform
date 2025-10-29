// CurrentPositionResponse.java
package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentPositionResponse {
    private String currentContentId; // Current position or null
}