import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ClientInfo {
  ws: WebSocket;
  roomCode?: string;
  role?: 'host' | 'peer';
}

interface Room {
  code: string;
  hostWs: WebSocket;
  peerWs: WebSocket | null;
  createdAt: number;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  // Map to store active rooms in memory (0 disk storage)
  const rooms = new Map<string, Room>();
  const clients = new Map<WebSocket, ClientInfo>();

  // WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const isViteHmr = request.headers['sec-websocket-protocol'] === 'vite-hmr';
      const isViteUrl = request.url?.includes('/@vite/') || request.url?.includes('vite');

      if (!isViteHmr && !isViteUrl) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.warn('[Server] Upgrade error:', err);
      try {
        socket.destroy();
      } catch (e) {
        // ignore
      }
    }
  });

  function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code: string;
    do {
      code = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    } while (rooms.has(code));
    return code;
  }

  function cleanupRoom(code: string, notifyReason?: string) {
    const room = rooms.get(code);
    if (!room) return;

    const closeMsg = JSON.stringify({
      type: 'room_closed',
      reason: notifyReason || 'closed_by_peer',
    });

    if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
      room.hostWs.send(closeMsg);
    }
    if (room.peerWs && room.peerWs.readyState === WebSocket.OPEN) {
      room.peerWs.send(closeMsg);
    }

    rooms.delete(code);
    console.log(`[Server] Room ${code} cleaned up.`);
  }

  wss.on('connection', (ws: WebSocket) => {
    clients.set(ws, { ws });

    ws.on('message', (data: string | Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const client = clients.get(ws);
        if (!client) return;

        switch (message.type) {
          case 'create_room': {
            // Clean up any existing room client was in
            if (client.roomCode) {
              cleanupRoom(client.roomCode, 'new_room_created');
            }

            const code = generateRoomCode();
            rooms.set(code, {
              code,
              hostWs: ws,
              peerWs: null,
              createdAt: Date.now(),
            });

            client.roomCode = code;
            client.role = 'host';

            ws.send(
              JSON.stringify({
                type: 'room_created',
                code,
                role: 'host',
              })
            );
            console.log(`[Server] Room ${code} created by host.`);
            break;
          }

          case 'join_room': {
            const rawCode = (message.code || '').trim().replace(/\s+/g, '');
            const room = rooms.get(rawCode);

            if (!room) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Комната не найдена или истек срок действия',
                })
              );
              return;
            }

            if (room.peerWs && room.peerWs !== ws) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Комната уже заполнена (максимум 2 участника)',
                })
              );
              return;
            }

            // Clean up any existing room
            if (client.roomCode && client.roomCode !== rawCode) {
              cleanupRoom(client.roomCode, 'joined_another_room');
            }

            room.peerWs = ws;
            client.roomCode = rawCode;
            client.role = 'peer';

            console.log(`[Server] Peer joined room ${rawCode}.`);

            // Notify joiner
            ws.send(
              JSON.stringify({
                type: 'room_ready',
                code: rawCode,
                role: 'peer',
              })
            );

            // Notify host
            if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
              room.hostWs.send(
                JSON.stringify({
                  type: 'room_ready',
                  code: rawCode,
                  role: 'host',
                })
              );
            }
            break;
          }

          case 'close_room': {
            const code = client.roomCode || message.code;
            if (code) {
              cleanupRoom(code, 'closed_by_user');
            }
            break;
          }

          case 'signal':
          case 'file_meta':
          case 'file_chunk':
          case 'file_complete':
          case 'text_message': {
            // Forward directly to the other client in the room
            const code = client.roomCode;
            if (!code) return;
            const room = rooms.get(code);
            if (!room) return;

            const targetWs = client.role === 'host' ? room.peerWs : room.hostWs;
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(data.toString());
            }
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[Server] Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client && client.roomCode) {
        console.log(`[Server] Client disconnected from room ${client.roomCode}`);
        cleanupRoom(client.roomCode, 'peer_disconnected');
      }
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[Server] Socket error:', err);
    });
  });

  // Periodically clean up stale empty rooms (e.g. > 30 mins old)
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      if (now - room.createdAt > 30 * 60 * 1000) {
        cleanupRoom(code, 'room_expired');
      }
    }
  }, 60000);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Vite middleware for development / Static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`1secondsharing server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
