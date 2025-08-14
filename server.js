const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {}; // Bağlı kullanıcıları ve kullanıcı adlarını saklamak için basit bir nesne

// Kök dizinden statik dosyaları sunar
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı adı belirleme
    socket.on('set-username', (username) => {
        if (!username || users[socket.id]) {
            return;
        }
        users[socket.id] = { username, id: socket.id };
        console.log(`Kullanıcı ${socket.id} kullanıcı adını ${username} olarak belirledi`);
        // Güncellenmiş kullanıcı listesini tüm istemcilere gönder
        io.emit('user-list-update', Object.values(users));
    });

    // Metin mesajlarını yönet
    socket.on('message', (data) => {
        io.emit('message', data);
    });

    // WebRTC arama başlatma
    socket.on('call', (data) => {
        const otherUser = Object.values(users).find(user => user.username === data.caller);
        if (otherUser) {
            io.to(otherUser.id).emit('call', { caller: users[socket.id].username });
        }
    });

    // WebRTC teklifini yönet (offer)
    socket.on('offer', (data) => {
        const targetUser = Object.values(users).find(user => user.username === data.to);
        if (targetUser) {
            io.to(targetUser.id).emit('offer', { from: users[socket.id].username, to: data.to, offer: data.offer });
        }
    });

    // WebRTC cevabını yönet (answer)
    socket.on('answer', (data) => {
        const targetUser = Object.values(users).find(user => user.username === data.to);
        if (targetUser) {
            io.to(targetUser.id).emit('answer', { from: users[socket.id].username, to: data.to, answer: data.answer });
        }
    });

    // WebRTC ICE adaylarını yönet
    socket.on('ice-candidate', (data) => {
        const targetUser = Object.values(users).find(user => user.username === data.to);
        if (targetUser) {
            io.to(targetUser.id).emit('ice-candidate', { from: users[socket.id].username, to: data.to, candidate: data.candidate });
        }
    });

    // Kullanıcı bağlantı kesilmesini yönet
    socket.on('disconnect', () => {
        console.log('Bir kullanıcı bağlantısı kesildi:', socket.id);
        const disconnectedUser = users[socket.id];
        if (disconnectedUser) {
            delete users[socket.id];
            io.emit('disconnect-user', disconnectedUser.username);
            // Güncellenmiş kullanıcı listesini tüm istemcilere gönder
            io.emit('user-list-update', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
