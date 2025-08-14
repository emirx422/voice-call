const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Bu satırın mevcut olduğundan emin olun
app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("offer", (data) => socket.broadcast.emit("offer", data));
  socket.on("answer", (data) => socket.broadcast.emit("answer", data));
  socket.on("ice-candidate", (data) => socket.broadcast.emit("ice-candidate", data));
});

http.listen(process.env.PORT || 3000, () => console.log("Server çalışıyor..."));
