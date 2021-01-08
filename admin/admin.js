let socket;
const canvasElement = document.getElementById('canvas');
const ctx = canvasElement.getContext("2d");

ctx.translate(canvasElement.width, 0);
ctx.scale(-1, 1);
ctx.lineJoin = ctx.lineCap = "round";
ctx.lineWidth = 6;
let count = 0;

socket = io.connect("https://188.230.231.221:3000");
const clients = [];

socket.on("point", drawBasedOnLockedAction);
socket.on("colorChange", colorChange);
socket.on("styleChange", styleChange);
socket.on("newClient", registerClient);

function registerClient(data) {
    clients.push(data);
}

function getClient(clientId) {
    let clientArray = clients.filter((obj) => obj.id === clientId);
    if (clientArray.length === 0 || clientArray.length > 1) return null;

    return clientArray[0];
}

function colorChange(data) {
    let client = getClient(data.id);
    if (client === null) return;
	client.color = data.color;
}

function styleChange(data) {
    let client = getClient(data.id);
	if (client === null) return;
	
	console.log(data.style);

	if (data.style.indexOf(PoseEnum.ROCK) > -1) {
		let [style, id] = data.style.split("-");
		client.style = style;
		rockStyle = ctx.createPattern(rockImages[id], "repeat");
	} else { client.style = data.style; }
}

function drawBasedOnLockedAction(data) {
	let client = getClient(data.id);
    if (client === null) return;

	if (!client.style || client.style === PoseEnum.NONE) return;

	if (client.lastPoint === undefined || client.lastPoint === null) {
		client.lastPoint = data.point;
		return;
	}

	let lastPoint = client.lastPoint;
	let points = client.points;
	let pointerFinger = data.point;
	let lineWidth = data.lineWidth;

	switch (client.style) {
		case PoseEnum.OPEN:
			drawLine(ctx, canvasElement, lastPoint, pointerFinger, lineWidth, client.color);
			break;
		case PoseEnum.TOGETHER:
			drawStickingLine(ctx, canvasElement, pointerFinger, points);
			client.points.push(pointerFinger);
			break;
		case PoseEnum.ROCK:
			count++;
			drawSpace(ctx, canvasElement, lastPoint, pointerFinger, lineWidth, rockStyle);
			break;
		case PoseEnum.PEACE:
			count++;
			drawImage(ctx, canvasElement, pointerFinger, peaceImg, count);
			break;
		case PoseEnum.OK:
			drawSpace(ctx, canvasElement, lastPoint, pointerFinger, lineWidth, spaceStyle);
			break;
		default:
			return;
	}

	client.lastPoint = pointerFinger;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
}

function copyUrl(button) {
	let tempInput = document.createElement("input");
	let value = window.location.href.replace("admin/", "");
	tempInput.value = value;
	document.body.appendChild(tempInput);
	tempInput.select();
	document.execCommand("copy");
	document.body.removeChild(tempInput);
	
	button.innerHTML = "URL Copied";
	setTimeout(() => {
		button.innerHTML = "Copy URL for Users";
	}, 1000);
}

const PoseEnum = Object.freeze({
	"FIST": "FIST",
	"ROCK": "ROCK'N'ROLL",
	"PEACE": "PEACE",
	"OK": "OK",
	"OPEN": "PALM_OPENED",
	"TOGETHER": "PALM_TOGETHER",
	"NONE": "None"
});

let spaceStyle = null;
let rockStyle = null;
rockImages = {};

const peaceImg = new Image();
peaceImg.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Peace_sign.svg/1200px-Peace_sign.svg.png";

const spaceImg = new Image();
spaceImg.src = "https://lh3.googleusercontent.com/YGJ77qN9KiwctZgfqV8Bf3hNo0rZvcFaPKDTkvtS6kVbtwyCS80Pm6dpXzJCCLZE1Q";
spaceImg.onload = function() {
	spaceStyle = ctx.createPattern(spaceImg, "repeat");
}

const rockImg1 = new Image();
rockImg1.src = "https://i.imgur.com/5PufBJ5.jpg";
rockImg1.onload = function() {
	rockImages[0] = rockImg1;
}

const rockImg2 = new Image();
rockImg2.src = "https://i.imgur.com/EQRAP9r.jpg";
rockImg2.onload = function() {
	rockImages[1] = rockImg2;
}

const rockImg3 = new Image();
rockImg3.src = "https://i.imgur.com/1EE0wIZ.jpg";
rockImg3.onload = function() {
	rockImages[2] = rockImg3;
}

const rockImg4 = new Image();
rockImg4.src = "https://i.imgur.com/siCL3id.jpg";
rockImg4.onload = function() {
	rockImages[3] = rockImg4;
}

const rockImg5 = new Image();
rockImg5.src = "https://i.imgur.com/InslIik.jpg";
rockImg5.onload = function() {
	rockImages[4] = rockImg5;
}
