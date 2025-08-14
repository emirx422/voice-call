const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const users = {}; // Kullanıcıları saklamak için nesne

app.use(express.static(__dirname));

io.on('connection', socket => {
    console.log('Yeni bir kullanıcı bağlandı: ' + socket.id);

    // Kullanıcı adı ayarlandığında
    socket.on('set-username', username => {
        users[socket.id] = username;
        io.emit('user-list-update', Object.values(users));
        console.log(`Kullanıcı adı ayarlandı: ${username}`);
    });

    // Mesaj geldiğinde
    socket.on('message', data => {
        io.emit('message', data);
    });

    // WebRTC sinyal işlemleri
    socket.on('offer', offer => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', answer => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('ice-candidate', candidate => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    // Kullanıcı ayrıldığında
    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı: ' + socket.id);
        delete users[socket.id];
        io.emit('user-list-update', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
