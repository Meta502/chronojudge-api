import fastify from "fastify";

import router from "./router";
import cors from "fastify-cors";
import socketio from "fastify-socket.io";

import osUtils from "node-os-utils";

import dotenv from "dotenv";

dotenv.config();

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
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
    socket.on("get-status", async () => {
      const cpuUsage = await osUtils.cpu.usage();
      socket.emit("status", {
        status: "Alive",
        cpuUsage: cpuUsage,
      });
    });
  });
});

export default server;
