const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/hall.html");
});

let pool = [];
let timer = null;

function resetPool() {
  pool = Array.from({ length: 90 }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5);
}

resetPool();

io.on("connection", socket => {
  console.log("Client connected");

  socket.on("start", speed => {
    if (timer) return;

    resetPool();

    timer = setInterval(() => {
      if (pool.length === 0) {
        clearInterval(timer);
        timer = null;
        return;
      }

      const number = pool.shift();
      io.emit("number", number);
    }, speed);
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Bingo server running on port", PORT);
});
