import { Client, Versions } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface RealtimeConfig {
  courseId: number | string;
  contentId: string;
  onEvent: (event: any) => void;
  authToken?: string; // Optional JWT for servers requiring auth on CONNECT
  debug?: boolean; // Reduce console overhead when false
  /** If your backend supports native WS STOMP (without SockJS), provide ws(s):// URL here for faster transport */
  nativeWsUrl?: string;
}

export function connectQaRealtime({ courseId, contentId, onEvent, authToken, debug = false, nativeWsUrl }: RealtimeConfig) {
  // Prefer native WebSocket endpoint if provided (usually faster than SockJS/XHR fallback)
  const socket = nativeWsUrl
    ? new WebSocket(nativeWsUrl)
    : new SockJS('http://localhost:8888/api/enrollment-service/ws/qa');

  // Queue messages while the client is connecting/reconnecting
  const pendingSends: Array<{ type: string; payload: any }> = [];

  const client = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 2000,
    // Align STOMP versions and heartbeats to improve compatibility
    stompVersions: new Versions(['1.2', '1.1', '1.0']),
    // Heartbeats add background frames; disable to minimize traffic/latency
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    debug: debug ? (str) => console.log('[STOMP]', str) : () => {},
    onConnect: () => {
      if (debug) console.log('Connected to QA WebSocket successfully');
      client.subscribe(`/topic/qa/course/${courseId}/content/${contentId}`, (msg) => {
        try {
          const event = JSON.parse(msg.body);
          if (debug) console.log('Received QA event:', event);
          onEvent(event);
        } catch (e) {
          console.error('JSON parse error:', e);
        }
      });

      // Flush any pending sends accumulated while disconnected
      if (pendingSends.length > 0) {
        const toSend = [...pendingSends];
        pendingSends.length = 0;
        toSend.forEach(({ type, payload }) => {
          try {
            client.publish({
              destination: `/app/qa/course/${courseId}/content/${contentId}`,
              body: JSON.stringify({ type, payload })
            });
          } catch (e) {
            console.error('Failed to publish pending QA event:', e);
          }
        });
      }
    },
    onWebSocketClose: (evt) => {
      if (debug) {
        console.warn('WebSocket closed:', {
          code: (evt as any)?.code,
          reason: (evt as any)?.reason,
          wasClean: (evt as any)?.wasClean,
        });
      }
    },
    onStompError: (frame) => {
      console.error('Broker error:', frame.headers['message']);
    }
  });

  client.activate();

  return {
    close: () => client.deactivate(),
    send: (type: string, payload: any) => {
      try {
        if (client.connected) {
          client.publish({
            destination: `/app/qa/course/${courseId}/content/${contentId}`,
            body: JSON.stringify({ type, payload })
          });
        } else {
          console.warn('STOMP not connected; queueing QA event');
          pendingSends.push({ type, payload });
        }
      } catch (e) {
        console.error('Failed to publish QA event:', e);
      }
    }
  };
}