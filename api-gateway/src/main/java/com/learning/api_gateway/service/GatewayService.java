package com.learning.api_gateway.service;

import com.learning.api_gateway.dto.ApiResponse;
import com.learning.api_gateway.dto.IntrospectRequest;
import com.learning.api_gateway.dto.IntrospectResponse;
import com.learning.api_gateway.repository.GatewayClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GatewayService {
    private GatewayClient gatewayClient;

    public Mono<ApiResponse<IntrospectResponse>> introspect(String token){
        return gatewayClient.introspect(IntrospectRequest.builder()
                .token(token)
                .build());
    }

}
