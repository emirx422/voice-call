const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Aktif kullanıcıları ve socket ID'lerini tutmak için bir obje
const activeUsers = {};

// Public klasöründeki dosyaları statik olarak sunar (CSS, JS, resimler vb.)
app.use(express.static('public'));

// Ana sayfa isteğini karşılar ve HTML dosyasını gönderir
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı adını ayarla
    socket.on('set-username', (username) => {
        activeUsers[socket.id] = username;
        console.log(`Kullanıcı adı ayarlandı: ${username} (${socket.id})`);
        io.emit('user-list-update', Object.values(activeUsers));
    });

    // Sohbet mesajlarını dinle ve yayınla
    socket.on('message', (data) => {
        console.log(`Yeni mesaj: ${data.username}: ${data.text}`);
        io.emit('message', data);
    });

    // WebRTC sinyalleşmesi için offerları dinle ve yayınla
    socket.on('offer', (offer) => {
        console.log('WebRTC offer geldi, yayınlanıyor.');
        socket.broadcast.emit('offer', offer);
    });

    // WebRTC sinyalleşmesi için answerları dinle ve yayınla
    socket.on('answer', (answer) => {
        console.log('WebRTC answer geldi, yayınlanıyor.');
        socket.broadcast.emit('answer', answer);
    });

    // WebRTC sinyalleşmesi için ICE adaylarını dinle ve yayınla
    socket.on('ice-candidate', (candidate) => {
        console.log('WebRTC ice-candidate geldi, yayınlanıyor.');
        socket.broadcast.emit('ice-candidate', candidate);
    });

    // Kullanıcı bağlantısı kesildiğinde
    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı:', socket.id);
        delete activeUsers[socket.id];
        io.emit('user-list-update', Object.values(activeUsers));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
