const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};
const userSockets = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');

    socket.on('set-username', (username) => {
        if (!username) return;
        const existingUser = Object.values(users).find(user => user.username === username);
        if (existingUser) {
            socket.emit('username-taken');
            return;
        }

        users[socket.id] = { username, isSharing: false };
        userSockets[username] = socket.id;

        io.emit('message', { username: 'Sistem', text: `${username} sohbete katıldı.`, timestamp: new Date().toLocaleTimeString(), isSystem: true });
        io.emit('user-list-update', Object.values(users));
        console.log(`Kullanıcı adı belirlendi: ${username}`);
    });
    
    socket.on('message', (data) => {
        data.timestamp = new Date().toLocaleTimeString();
        io.emit('message', data);
    });

    socket.on('voice-activity', (volume) => {
        const currentUser = users[socket.id];
        if (currentUser) {
            socket.broadcast.emit('user-voice-activity', { username: currentUser.username, volume });
        }
    });

    socket.on('call', (data) => {
        const callerSocket = users[socket.id];
        if (callerSocket) {
            io.emit('call', { caller: callerSocket.username });
        }
    });
    
    socket.on('offer', (data) => {
        const toSocketId = userSockets[data.to];
        if (toSocketId) {
            io.to(toSocketId).emit('offer', { from: users[socket.id].username, offer: data.offer });
        }
    });

    socket.on('answer', (data) => {
        const toSocketId = userSockets[data.to];
        if (toSocketId) {
            io.to(toSocketId).emit('answer', { from: users[socket.id].username, answer: data.answer });
        }
    });
    
    socket.on('ice-candidate', (data) => {
        const toSocketId = userSockets[data.to];
        if (toSocketId) {
            io.to(toSocketId).emit('ice-candidate', { from: users[socket.id].username, candidate: data.candidate });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const disconnectedUser = users[socket.id].username;
            delete userSockets[disconnectedUser];
            delete users[socket.id];
            io.emit('disconnect-user', disconnectedUser);
            io.emit('user-list-update', Object.values(users));
            io.emit('message', { username: 'Sistem', text: `${disconnectedUser} sohbetten ayrıldı.`, timestamp: new Date().toLocaleTimeString(), isSystem: true });
            console.log(`Kullanıcı ayrıldı: ${disconnectedUser}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});
