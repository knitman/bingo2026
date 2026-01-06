const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let drawPool = [];
let called = [];
let drawTimer = null;
let tickets = {};

function resetDraw() {
    drawPool = Array.from({ length: 90 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    called = [];
}
resetDraw();

io.on("connection", socket => {
    socket.emit("sync", called);

    socket.on("startDraw", speed => {
        if (drawTimer) return;
        resetDraw();
        drawTimer = setInterval(() => {
            if (drawPool.length === 0) { stopDraw(); return; }
            const n = drawPool.shift();
            called.push(n);
            io.emit("number", n);
            checkWinners();
        }, speed);
    });

    socket.on("stopDraw", stopDraw);

    socket.on("createTicket", data => {
        tickets[data.id] = { nums: data.nums, player: data.player };
        socket.emit("ticketData", { nums: data.nums });
    });

    socket.on("requestTicket", id => {
        if (tickets[id]) {
            socket.emit("ticketData", { nums: tickets[id].nums });
        }
    });
});

function stopDraw() {
    clearInterval(drawTimer);
    drawTimer = null;
}

function checkWinners() {
    for (const id in tickets) {
        const t = tickets[id];
        const win = t.nums.every(n => called.includes(n));
        if (win) {
            io.emit("winner", { id, name: t.player, wins: 1 });
            stopDraw();
            break;
        }
    }
}

http.listen(3000, () => console.log("Bingo server running on port 3000"));