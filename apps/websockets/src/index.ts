import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import ws from 'ws';

const fastify = Fastify();
fastify.register(websocket);

const server = fastify.server; // raw Node http.Server
const wss = new ws.Server({ server });

fastify.get('/health', async () => 'OK');

fastify.listen({ port: 4000 }, () => {
  console.log('🚀 Fastify WS server running on ws://localhost:4000');
});
