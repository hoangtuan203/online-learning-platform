package com.learning.content_service.dto;

import java.util.List;

public record BulkOperationResponse(
        boolean success,
        List<ContentResponse> contents,
        String errorMessage,
        int successCount
) {}