const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let users = []; // Aktif kullanıcı listesi

io.on("connection", (socket) => {
    console.log("Yeni bir kullanıcı bağlandı.");

    // Kullanıcı adı alındığında listeye ekle ve herkese duyur
    socket.on('set-username', (username) => {
        socket.username = username;
        if (!users.includes(username)) {
            users.push(username);
        }
        io.emit('user-list-update', users); // Herkese yeni listeyi gönder
        console.log("Kullanıcı listesi güncellendi:", users);
    });

    // Bağlantı kesildiğinde kullanıcıyı listeden çıkar ve herkese duyur
    socket.on('disconnect', () => {
        console.log("Bir kullanıcı ayrıldı.");
        if (socket.username) {
            users = users.filter(user => user !== socket.username);
            io.emit('user-list-update', users); // Herkese güncel listeyi gönder
            console.log("Kullanıcı listesi güncellendi:", users);
        }
    });
  
    // Mevcut sesli arama ve mesajlaşma kodları
    socket.on("offer", (data) => socket.broadcast.emit("offer", data));
    socket.on("answer", (data) => socket.broadcast.emit("answer", data));
    socket.on("ice-candidate", (data) => socket.broadcast.emit("ice-candidate", data));
    socket.on('message', (data) => io.emit('message', data));
});

http.listen(process.env.PORT || 3000, () => console.log("Server çalışıyor..."));
