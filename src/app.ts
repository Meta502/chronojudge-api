import fastify from "fastify";

import router from "./router";
import cors from "fastify-cors";
import socketio from "fastify-socket.io";

import dotenv from "dotenv";
import socketController from "./controller/socketController";
import { ungzip } from "pako";

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

server.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  function (req, body, done) {
    if (
      req.headers["content-encoding"] &&
      req.headers["content-encoding"] === "gzip"
    ) {
      const decompressed = ungzip(body, { to: "string" });
      done(null, JSON.parse(decompressed));
    } else {
      done(null, JSON.parse(body.toString("utf-8")));
    }
  }
);

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
