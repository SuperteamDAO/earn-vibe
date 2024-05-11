import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Server as WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

let vibeCount = 0;
const usersVibing: Map<string, WebSocket> = new Map();

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({ vibeCount, userIds: Array.from(usersVibing.keys()) }),
  );

  ws.on('message', (message) => {
    const { userId, action } = JSON.parse(message.toString());

    if (action === 'vibe') {
      if (!usersVibing.has(userId)) {
        usersVibing.set(userId, ws);
        vibeCount++;
        broadcast({ vibeCount, userIds: Array.from(usersVibing.keys()) });
      }
    }
  });

  ws.on('close', () => {
    usersVibing.forEach((userWs, userId) => {
      if (userWs === ws) {
        usersVibing.delete(userId);
        vibeCount--;
        broadcast({ vibeCount, userIds: Array.from(usersVibing.keys()) });
      }
    });
  });
});

function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
