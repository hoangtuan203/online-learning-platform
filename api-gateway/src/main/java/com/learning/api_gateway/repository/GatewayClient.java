package com.learning.api_gateway.repository;

import com.learning.api_gateway.dto.ApiResponse;
import com.learning.api_gateway.dto.IntrospectRequest;
import com.learning.api_gateway.dto.IntrospectResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;

public interface GatewayClient {
    @PostExchange(url = "/users/introspect", contentType = MediaType.APPLICATION_JSON_VALUE)
    Mono<ApiResponse<IntrospectResponse>> introspect(@RequestBody IntrospectRequest request);
}
