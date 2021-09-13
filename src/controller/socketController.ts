import osUtils from "node-os-utils";
import { Socket } from "socket.io";

const socketController = (socket: Socket) => {
  socket.on("get-status", async () => {
    const cpuUsage = await osUtils.cpu.usage();

    switch (cpuUsage < 75) {
      case true:
        socket.emit("status", {
          status: "Alive",
          cpuUsage: cpuUsage,
        });
        break;
      case false:
        socket.emit("status", {
          status: "High Load",
          cpuUsage: cpuUsage,
        });
        break;
    }
  });
};

export default socketController;
