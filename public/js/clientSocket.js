var connected = false;

var socket = io("http://localhost:3003", {
  transports: ["websocket", "polling", "flashsocket"],
});
socket.emit("setup", userLoggedIn);

socket.on("connected", () => (connected = true));
socket.on("message received", (newMessage) => messageReceived(newMessage));
