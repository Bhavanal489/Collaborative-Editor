import { Server } from "@hocuspocus/server";

const server = new Server({
  port: 1234,

  async onConnect({ documentName, socketId }) {
    console.log(
      `CONNECTED: document=${documentName}, socket=${socketId}`
    );
  },

  async onDisconnect({ documentName, socketId }) {
    console.log(
      `DISCONNECTED: document=${documentName}, socket=${socketId}`
    );
  },

  async onChange({ documentName, clientsCount }) {
    console.log(
      `CHANGE: document=${documentName}, clients=${clientsCount}`
    );
  },
});

server.listen();

console.log("Hocuspocus server running on ws://127.0.0.1:1234");