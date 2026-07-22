import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AppScreen,
  FileMetadata,
  FileTransferItem,
  RoomState,
  SharedTextItem,
  WSMessage,
} from '../types';
import { triggerConfetti } from './utils';

const CHUNK_SIZE = 64 * 1024; // 64 KB chunks for fast streaming

export function useRoomWebSocket() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Persists until the user dismisses it — no auto-hide.
  const [roomClosedNotice, setRoomClosedNotice] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({
    code: '',
    role: null,
    connectedUsers: 0,
    peerConnected: false,
  });

  const [transfers, setTransfers] = useState<FileTransferItem[]>([]);
  const [sharedTexts, setSharedTexts] = useState<SharedTextItem[]>([]);
  const [p2pConnected, setP2pConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isClosingLocallyRef = useRef<boolean>(false);

  // Incoming files buffer map: fileId -> { meta, chunks: ArrayBuffer[], bytesReceived, startTime }
  const fileBuffersRef = useRef<
    Map<
      string,
      {
        meta: FileMetadata;
        chunks: ArrayBuffer[];
        bytesReceived: number;
        startTime: number;
        lastSpeedUpdate: number;
        bytesSinceLastSpeed: number;
      }
    >
  >(new Map());

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect WebSocket to backend server
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setErrorMessage(null);
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WS socket state notice:', err);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          handleWSMessage(msg);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };
    } catch (err) {
      console.error('WebSocket initialization error:', err);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    }
  }, []);

  useEffect(() => {
    connect();

    // Heartbeat
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Handle incoming WS message
  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'room_created': {
        setRoomState({
          code: msg.code || '',
          role: 'host',
          connectedUsers: 1,
          peerConnected: false,
        });
        setScreen('waiting');
        setErrorMessage(null);
        setTransfers([]);
        setSharedTexts([]);
        break;
      }

      case 'room_ready': {
        setRoomState((prev) => ({
          ...prev,
          code: msg.code || prev.code,
          role: msg.role || prev.role,
          connectedUsers: 2,
          peerConnected: true,
        }));
        setScreen('transfer');
        setErrorMessage(null);

        // Initiate WebRTC connection
        if (msg.role === 'host') {
          initiateWebRTCAsHost();
        }
        break;
      }

      case 'error': {
        setErrorMessage(msg.message || 'Произошла ошибка');
        break;
      }

      case 'room_closed': {
        cleanupPeerConnection();
        if (!isClosingLocallyRef.current) {
          // The peer ended the session: drop straight to home and surface a
          // dismissible toast rather than an interstitial screen.
          // msg.reason carries a machine code (e.g. "closed_by_user"), so it
          // is deliberately not shown to the user.
          setRoomClosedNotice(
            'The other user closed the room. The connection was terminated and all transferred data has been shredded.'
          );
        }
        setScreen('home');
        isClosingLocallyRef.current = false;
        setRoomState({
          code: '',
          role: null,
          connectedUsers: 0,
          peerConnected: false,
        });
        break;
      }

      case 'signal': {
        handleWebRTCSignal(msg.payload);
        break;
      }

      case 'file_meta': {
        handleFileMetaIncoming(msg.payload);
        break;
      }

      case 'file_chunk': {
        handleFileChunkIncoming(msg.payload);
        break;
      }

      case 'text_message': {
        if (msg.payload) {
          setSharedTexts((prev) => [msg.payload, ...prev]);
        }
        break;
      }

      default:
        break;
    }
  }, []);

  // Send JSON over WebSocket
  const sendWS = useCallback((data: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // WebRTC Setup
  const cleanupPeerConnection = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setP2pConnected(false);
  }, []);

  const initiateWebRTCAsHost = useCallback(() => {
    cleanupPeerConnection();

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;

    const dc = pc.createDataChannel('1secondsharing_channel');
    dataChannelRef.current = dc;
    setupDataChannelEvents(dc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWS({
          type: 'signal',
          payload: { candidate: event.candidate },
        });
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        sendWS({
          type: 'signal',
          payload: { sdp: pc.localDescription },
        });
      })
      .catch((err) => console.error('Error creating RTCPeerConnection offer:', err));
  }, [cleanupPeerConnection, sendWS]);

  const handleWebRTCSignal = useCallback(
    async (payload: any) => {
      if (!payload) return;

      if (payload.sdp) {
        if (!peerConnectionRef.current) {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          });
          peerConnectionRef.current = pc;

          pc.ondatachannel = (event) => {
            dataChannelRef.current = event.channel;
            setupDataChannelEvents(event.channel);
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              sendWS({
                type: 'signal',
                payload: { candidate: event.candidate },
              });
            }
          };
        }

        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        if (payload.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendWS({
            type: 'signal',
            payload: { sdp: pc.localDescription },
          });
        }
      } else if (payload.candidate && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    },
    [sendWS]
  );

  const setupDataChannelEvents = useCallback((dc: RTCDataChannel) => {
    dc.onopen = () => {
      setP2pConnected(true);
      console.log('WebRTC DataChannel opened!');
    };

    dc.onclose = () => {
      setP2pConnected(false);
      console.log('WebRTC DataChannel closed.');
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'file_meta') {
          handleFileMetaIncoming(msg.payload);
        } else if (msg.type === 'file_chunk') {
          handleFileChunkIncoming(msg.payload);
        } else if (msg.type === 'text_message') {
          if (msg.payload) {
            setSharedTexts((prev) => [msg.payload, ...prev]);
          }
        }
      } catch (e) {
        console.error('Error handling DataChannel message:', e);
      }
    };
  }, []);

  // Send DataChannel or WS message to peer
  const sendToPeer = useCallback(
    (data: { type: string; payload: any }) => {
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify(data));
      } else {
        // WS streaming fallback
        sendWS({
          type: data.type as any,
          payload: data.payload,
        });
      }
    },
    [sendWS]
  );

  // Incoming file meta handler
  const handleFileMetaIncoming = useCallback((meta: FileMetadata) => {
    fileBuffersRef.current.set(meta.id, {
      meta,
      chunks: [],
      bytesReceived: 0,
      startTime: Date.now(),
      lastSpeedUpdate: Date.now(),
      bytesSinceLastSpeed: 0,
    });

    const newItem: FileTransferItem = {
      id: meta.id,
      name: meta.name,
      size: meta.size,
      type: meta.type,
      progress: 0,
      bytesTransferred: 0,
      speed: 0,
      status: 'transferring',
      isIncoming: true,
      senderRole: meta.senderRole,
      timestamp: meta.timestamp,
    };

    setTransfers((prev) => [newItem, ...prev]);
  }, []);

  // Incoming file chunk handler
  const handleFileChunkIncoming = useCallback((payload: { id: string; chunkIndex: number; data: string; bytes: number }) => {
    const bufferData = fileBuffersRef.current.get(payload.id);
    if (!bufferData) return;

    // Decode base64 chunk to ArrayBuffer
    const binaryString = atob(payload.data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    bufferData.chunks[payload.chunkIndex] = bytes.buffer;
    bufferData.bytesReceived += len;
    bufferData.bytesSinceLastSpeed += len;

    const now = Date.now();
    let currentSpeed = 0;
    const timeDiff = (now - bufferData.lastSpeedUpdate) / 1000;
    if (timeDiff >= 0.5) {
      currentSpeed = bufferData.bytesSinceLastSpeed / timeDiff;
      bufferData.bytesSinceLastSpeed = 0;
      bufferData.lastSpeedUpdate = now;
    }

    const progress = Math.min(100, Math.round((bufferData.bytesReceived / bufferData.meta.size) * 100));
    const isFinished = bufferData.bytesReceived >= bufferData.meta.size || payload.chunkIndex + 1 === bufferData.meta.totalChunks;

    if (isFinished) {
      const blob = new Blob(bufferData.chunks, { type: bufferData.meta.type || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      let previewUrl: string | undefined = undefined;
      if (bufferData.meta.type.startsWith('image/')) {
        previewUrl = blobUrl;
      }

      setTransfers((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                progress: 100,
                bytesTransferred: bufferData.meta.size,
                status: 'completed',
                speed: 0,
                blob,
                blobUrl,
                previewUrl,
              }
            : item
        )
      );

      fileBuffersRef.current.delete(payload.id);
      triggerConfetti();
    } else {
      setTransfers((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                progress,
                bytesTransferred: bufferData.bytesReceived,
                speed: currentSpeed > 0 ? currentSpeed : item.speed,
              }
            : item
        )
      );
    }
  }, []);

  // Action: Create Room
  const createRoom = useCallback(() => {
    isClosingLocallyRef.current = false;
    sendWS({ type: 'create_room' });
  }, [sendWS]);

  // Action: Join Room
  const joinRoom = useCallback(
    (code: string) => {
      isClosingLocallyRef.current = false;
      const cleanCode = code.trim().replace(/\s+/g, '');
      if (!cleanCode) {
        setErrorMessage('Enter room code');
        return;
      }
      sendWS({ type: 'join_room', code: cleanCode });
    },
    [sendWS]
  );

  // Action: Close Room
  const closeRoom = useCallback(() => {
    isClosingLocallyRef.current = true;
    sendWS({ type: 'close_room' });
    cleanupPeerConnection();
    setScreen('home');
    setRoomState({
      code: '',
      role: null,
      connectedUsers: 0,
      peerConnected: false,
    });
    setTransfers([]);
    setSharedTexts([]);
  }, [cleanupPeerConnection, sendWS]);

  // Action: Send Text Message
  const sendText = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const item: SharedTextItem = {
        id: 'txt_' + Math.random().toString(36).substring(2, 9),
        text: text.trim(),
        senderRole: roomState.role || 'host',
        timestamp: Date.now(),
      };

      setSharedTexts((prev) => [item, ...prev]);

      sendToPeer({
        type: 'text_message',
        payload: item,
      });
    },
    [roomState.role, sendToPeer]
  );

  // Action: Send Files
  const sendFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      for (const file of fileArray) {
        const fileId = 'file_' + Math.random().toString(36).substring(2, 10);
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        let previewUrl: string | undefined = undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }

        const transferItem: FileTransferItem = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          progress: 0,
          bytesTransferred: 0,
          speed: 0,
          status: 'transferring',
          isIncoming: false,
          senderRole: roomState.role || 'host',
          timestamp: Date.now(),
          previewUrl,
          blob: file,
          blobUrl: URL.createObjectURL(file),
        };

        setTransfers((prev) => [transferItem, ...prev]);

        const meta: FileMetadata = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          totalChunks,
          senderRole: roomState.role || 'host',
          timestamp: Date.now(),
        };

        sendToPeer({
          type: 'file_meta',
          payload: meta,
        });

        // Read and send chunks sequentially
        let bytesSent = 0;
        let lastSpeedUpdate = Date.now();
        let bytesSinceLastSpeed = 0;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunkBlob = file.slice(start, end);

          const arrayBuffer = await chunkBlob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);

          // Convert chunk to base64 string
          let binary = '';
          const len = uint8.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64Data = btoa(binary);

          sendToPeer({
            type: 'file_chunk',
            payload: {
              id: fileId,
              chunkIndex,
              data: base64Data,
              bytes: len,
            },
          });

          bytesSent += len;
          bytesSinceLastSpeed += len;

          const now = Date.now();
          const timeDiff = (now - lastSpeedUpdate) / 1000;
          let speed = 0;
          if (timeDiff >= 0.5) {
            speed = bytesSinceLastSpeed / timeDiff;
            bytesSinceLastSpeed = 0;
            lastSpeedUpdate = now;
          }

          const progress = Math.min(100, Math.round((bytesSent / file.size) * 100));

          setTransfers((prev) =>
            prev.map((item) =>
              item.id === fileId
                ? {
                    ...item,
                    progress,
                    bytesTransferred: bytesSent,
                    speed: speed > 0 ? speed : item.speed,
                    status: progress === 100 ? 'completed' : 'transferring',
                  }
                : item
            )
          );

          // Slight pause every 10 chunks to yield to event loop for smooth UI rendering
          if (chunkIndex % 10 === 0) {
            await new Promise((res) => setTimeout(res, 5));
          }
        }

        // Final completion mark
        setTransfers((prev) =>
          prev.map((item) =>
            item.id === fileId
              ? {
                  ...item,
                  progress: 100,
                  bytesTransferred: file.size,
                  speed: 0,
                  status: 'completed',
                }
              : item
          )
        );
      }
    },
    [roomState.role, sendToPeer]
  );

  return {
    screen,
    setScreen,
    wsConnected,
    errorMessage,
    setErrorMessage,
    roomClosedNotice,
    setRoomClosedNotice,
    roomState,
    transfers,
    sharedTexts,
    p2pConnected,
    createRoom,
    joinRoom,
    closeRoom,
    sendFiles,
    sendText,
  };
}
