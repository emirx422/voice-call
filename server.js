const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const activeUsers = {};
const userSocketMap = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function updateUserList() {
    const userArray = Object.values(activeUsers);
    io.emit('user-list-update', userArray);
}

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('set-username', (username) => {
        activeUsers[socket.id] = { username, isSharing: false };
        userSocketMap[username] = socket.id;
        console.log(`Kullanıcı adı ayarlandı: ${username} (${socket.id})`);
        updateUserList();
    });

    socket.on('message', (data) => {
        console.log(`Yeni mesaj: ${data.username}: ${data.text}`);
        io.emit('message', data);
    });

    socket.on('call', ({ caller }) => {
        io.emit('call', { caller });
    });
    
    socket.on('offer', (data) => {
        const targetSocketId = userSocketMap[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('offer', { from: activeUsers[socket.id].username, to: data.to, offer: data.offer });
        }
    });

    socket.on('answer', (data) => {
        const targetSocketId = userSocketMap[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('answer', { from: activeUsers[socket.id].username, to: data.to, answer: data.answer });
        }
    });

    socket.on('ice-candidate', (data) => {
        const targetSocketId = userSocketMap[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('ice-candidate', { from: activeUsers[socket.id].username, to: data.to, candidate: data.candidate });
        }
    });

    socket.on('start-screen-share', () => {
        if (activeUsers[socket.id]) {
            activeUsers[socket.id].isSharing = true;
            updateUserList();
        }
    });

    socket.on('stop-screen-share', () => {
        if (activeUsers[socket.id]) {
            activeUsers[socket.id].isSharing = false;
            updateUserList();
        }
    });

    socket.on('disconnect', () => {
        const disconnectedUser = activeUsers[socket.id]?.username;
        if (disconnectedUser) {
            delete userSocketMap[disconnectedUser];
            delete activeUsers[socket.id];
            console.log('Bir kullanıcı ayrıldı:', socket.id);
            updateUserList();
            io.emit('disconnect-user', disconnectedUser);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
