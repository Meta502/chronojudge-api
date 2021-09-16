import fastify from "fastify";

import router from "./router";
import cors from "fastify-cors";
import socketio from "fastify-socket.io";

import dotenv from "dotenv";
import socketController from "./controller/socketController";

dotenv.config();

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
  bodyLimit: 52428800,
});

// Middleware: Router
server.register(router);
server.register(cors);
server.register(socketio, {
  path: process.env.SOCKET_IO_PATH,
  cors: {
    origin: "*",
  },
});

server.ready((err) => {
  if (err) throw err;
  server.io.on("connection", (socket) => {
    socketController(socket);
  });
  console.log(server.printRoutes());
});

process.on("uncaughtException", () => {
  console.error("A Java exception might have occurred.");
});

export default server;
