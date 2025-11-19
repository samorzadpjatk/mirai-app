import Fastify from "fastify";
import websocket from "@fastify/websocket";
// import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from "ws";
// import { appRouter } from '@repo/trpc/router';
// import { createContext } from '@repo/trpc/context';

const fastify = Fastify();
fastify.register(websocket);

const server = fastify.server;
const wss = new WebSocketServer({ server });

// applyWSSHandler({ wss, router: appRouter, createContext });

fastify.get("/health", async () => "OK");

fastify.listen({ port: 4000 }, () => {
  console.log("🚀 Fastify WS server running on ws://localhost:4000");
});
