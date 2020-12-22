const express = require('express');
// create express app
const app = express();
// create server
const server = require('http').Server(app);
// connect server to socket
const io = require('socket.io')(server);
// get random roomId using uuid
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  // server responds by redirecting root to /room
  res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
  // get roomid from URL
  res.render('room', { roomId: req.params.room });
});

// when a client connects to server
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    console.log(roomId, userId);
    socket.join(roomId);
    // broadcast a user-connected event to all clients -> this will trigger event on client-side
    socket.to(roomId).broadcast.emit('user-connected', userId);
    // when user disconnects
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
  });
});
// server listen on port 3000
server.listen(3000);
