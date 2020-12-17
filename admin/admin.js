let socket;
const canvasElement = document.getElementById('canvas');
const ctx = canvasElement.getContext("2d");

ctx.translate(canvasElement.width, 0);
ctx.scale(-1, 1);

socket = io.connect("https://188.230.231.221:3000");
const clients = [];
ctx.lineWidth = 6;

const ids = [];

socket.on("point", draw);
socket.on("colorChange", colorChange);
socket.on("newClient", registerClient);

function colorChange(data) {
    let client = getClient(data.id);
    if (client === null) return;

    client.color = data.color;
}

function draw(data) {
    let client = getClient(data.id);
    if (client === null) return;

    lastPoint = client.lastPoint;
    pointerFinger = [data.coordinates.x, data.coordinates.y]

    if (lastPoint === null) {
        client.lastPoint = pointerFinger;
    } else {
        ctx.strokeStyle = client.color;
        ctx.beginPath();
        ctx.moveTo(lastPoint[0] * canvasElement.width, lastPoint[1] * canvasElement.height);
        ctx.lineTo(pointerFinger[0] * canvasElement.width, pointerFinger[1] * canvasElement.height);
        ctx.stroke();
        client.lastPoint = pointerFinger;
    }
}

function registerClient(data) {
    clients.push(data);
}

function getClient(clientId) {
    let clientArray = clients.filter((obj) => obj.id === clientId);
    if (clientArray.length === 0 || clientArray.length > 1) return null;

    return clientArray[0];
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
}
