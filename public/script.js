/// contains client-side JS code

// ger socket object
const socket = io('/');

const videoGrid = document.getElementById('video-grid');

const peers = {};

// create a connection to Peer server, gives back a userId via open event
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001',
});

// create a new video HTML element
const myVideo = document.createElement('video');
myVideo.muted = true; // mute ourselves

// get access to microphone and camera
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then( stream => {
  // after getting access, all video/audio output will go to stream variable. Attach stream to video HTML element, and then display it.
  addVideoStream(myVideo, stream);

  // when OTHER user successfully connects via peer-to-peer, add their video stream.
  myPeer.on('call', call => {
    // answer call and send them our stream
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video,userVideoStream);
    });
  });

  // socket.on -> listens for the event 'user-connected' (fired by server, a new client joins room)
  socket.on('user-connected', userId => {
    console.log('User connected ', userId);
    // establish a peer-to-peer connection with new user -> send them our stream
    connectToNewUser(userId, stream);
  });

  // socket disconnected
  socket.on('user-disconnected', userId => {
    console.log(userId);
    if (peers[userId]){
      peers[userId].close();
    };
  });
});

// once Peer server returns, it will create an open event and pass back userId
myPeer.on('open', id => {
  // emit roomId and userId back to server as emit event -> tells server that this client wants to join the room
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream){
  /// calls new user and adds our video stream to their video div element.
  // peer.call establishes the peer-to-peer connection with userId, and sends our stream to them
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  // when user replies (establishing the peer-to-peer connection), add THEIR video stream to our div video element (BUT THIS DOESN'T WORK??)
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  // when user closes their video, remove their video element.
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
}


function addVideoStream(video, stream){
  // attaches stream to the video HTML element
  video.srcObject = stream;
  // once metadata is loaded, begin playing video/audio stream
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  // add video HTML element to videoGrid div element on page
  videoGrid.append(video);
};
