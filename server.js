const express = require("express");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const { ExpressPeerServer } = require("peer");

const PORT = process.env.PORT || 5000;

const app = express();
const server = createServer(app);
const io = new Server(server);
const peerServer = ExpressPeerServer(server, { debug: true });

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

io.on("connection", (socket) => {
  console.log("New user connected!");
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("newMessage", message);
    });
  });
});

server.listen(PORT, () => {
  process.stdout.write(`Server listening on port ${PORT}`);
});
