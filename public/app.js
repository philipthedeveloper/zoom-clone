const socket = io("/");
var peer = new Peer({
  // port: "3000",
  // path: "/peerjs",
  // host: "/",
  path: "/peerjs", // Set the path to /peerjs
  host: "zoom-clone-9uzm.onrender.com", // Set the host to your production server URL
  secure: true, // Use secure WebSocket connection
});
let videoContainer = document.querySelector(".video-container");
let myVideoEl = document.createElement("video");
const textInput = document.querySelector(".main__message__container input");
const chatMessagesList = document.querySelector(".messages");
const muteBtn = document.querySelector(".main__controls__button.mute");
const stopVideoBtn = document.querySelector(
  ".main__controls__button.stop-video"
);
const leaveRoomBtn = document.querySelector(
  ".main__controls__button.leave-meeting"
);

let myStream;

peer.on("open", (userId) => {
  socket.emit("join-room", ROOM_ID, userId);
});

peer.on("close", (userId) => {
  socket.emit("leave-room", ROOM_ID, userId);
  location.pathname = `/logout/${ROOM_ID}`;
});

// myVideoEl.muted = true;
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    myStream = stream;
    addVideoStream(myVideoEl, stream);

    peer.on("call", function (call) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream, call.peer);
      });

      call.on("close", () => {
        removeVideoStream(call.peer);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userId);
  });

  call.on("close", () => {
    removeVideoStream(userId);
  });
};

const removeVideoStream = (userId) => {
  const match = document.querySelector(`#video-stream-${userId}`);
  if (match) {
    match.remove();
  }
};

const addVideoStream = (videoEl, stream, userId) => {
  videoEl.srcObject = stream;
  videoEl.id = userId ? `video-stream-${userId}` : Math.random().toString();
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });
  videoContainer.appendChild(videoEl);
};

document.addEventListener("keydown", (e) => {
  if (
    e.target.matches(".main__message__container input") &&
    e.key === "Enter" &&
    textInput.value.length !== 0
  ) {
    socket.emit("message", textInput.value);
    textInput.value = "";
  }
});

socket.on("newMessage", (message) => {
  const userEl = document.createElement("b");
  userEl.textContent = "User";
  const newMessageItem = document.createElement("li");
  newMessageItem.appendChild(userEl);
  newMessageItem.innerHTML += `<br />${message}`;
  chatMessagesList.appendChild(newMessageItem);
  scrollToBottom();
});

socket.on("user-exit", (userId) => {
  removeVideoStream(userId);
});

const scrollToBottom = () => {
  const mainChatWindow = document.querySelector(".main__chat__window");
  mainChatWindow.scrollTop = mainChatWindow.scrollHeight;
};

const setUnmuteButton = () => {
  const html = `
  <i class="fa-solid fa-microphone-slash unmute"></i>
  <span>Unmute</span>
  `;
  muteBtn.innerHTML = html;
};

const setMuteButton = () => {
  const html = `
  <i class="fa-solid fa-microphone"></i>
  <span class="roboto-regular">Mute</span>
  `;
  muteBtn.innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="fa-solid fa-video-slash unmute"></i>
  <span class="roboto-regular">Play Video</span>
  `;
  stopVideoBtn.innerHTML = html;
};

const setStopVideo = () => {
  const html = `
  <i class="fa-solid fa-video"></i>
  <span class="roboto-regular">Stop Video</span>
  `;
  stopVideoBtn.innerHTML = html;
};

const toggleStreamMute = () => {
  const enabled = myStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    myStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
};

const togglePlayStreamVideo = () => {
  const enabled = myStream?.getVideoTracks()[0]?.enabled;
  if (enabled) {
    myStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
};

const handleLeaveRoom = () => {
  peer.destroy();
};

muteBtn.addEventListener("click", toggleStreamMute);
stopVideoBtn.addEventListener("click", togglePlayStreamVideo);
leaveRoomBtn.addEventListener("click", handleLeaveRoom);
