const textElement = document.getElementById("pose");
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext("2d");

const canvasElement1 = document.getElementById('canvas1');
const ctx = canvasElement1.getContext("2d");
ctx.lineWidth = 6;
ctx.lineJoin = ctx.lineCap = "round";

canvasCtx.translate(canvasElement.width, 0);
canvasCtx.scale(-1, 1);
ctx.translate(canvasElement.width, 0);
ctx.scale(-1, 1);

let lastPoint = null;
let percent = 0;
let nonePercent = 0;
let count = 0;
let lockedPose;
spaceStyle = null;
const socket = io.connect("https://188.230.231.221:3000");

function onResults(results) {  
    // Draw the overlays.
    canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
	results.image, 0, 0, canvasElement.width, canvasElement.height);
	let lineWidth = 6;
    if (results.multiHandLandmarks && results.multiHandedness) {
		nonePercent = 0;

		for (let index = 0; index < results.multiHandLandmarks.length; index++) {
			const classification = results.multiHandedness[index];
			const isRightHand = classification.label === 'Right';
			const landmarks = results.multiHandLandmarks[index];
			drawConnectors(
				canvasCtx, landmarks, HAND_CONNECTIONS,
				{color: isRightHand ? '#00FF00' : '#FF0000'}
			);
			drawLandmarks(canvasCtx, landmarks, {
				color: isRightHand ? '#00FF00' : '#FF0000',
				fillColor: isRightHand ? '#FF0000' : '#00FF00'
			});
		}

		if (!lockedPose) {
			let handPose = determinePose(results.multiHandLandmarks[0]);
			textElement.innerHTML = handPose;
		}
		
		if (results.multiHandLandmarks[0][8]) {
			let pointerFinger = [results.multiHandLandmarks[0][8].x, results.multiHandLandmarks[0][8].y];

			if (lastPoint === null) {
				lastPoint = pointerFinger;
			} else {
				if (results.multiHandLandmarks.length < 2) {
					for (let i = 0; i < 3; i++) {
						if (dis(results.multiHandLandmarks[0][8 + i*4], results.multiHandLandmarks[0][12 + i*4]) < 0.05)
							lineWidth += 4;
					}

					drawBasedOnAction(lastPoint, pointerFinger, lineWidth);
					lastPoint = pointerFinger;
					socket.emit("point", {x: pointerFinger[0], y: pointerFinger[1]});
				} else { lastPoint = null; }
			}
		}
    } else {
		lastPoint = null;

		if (nonePercent >= 100) {
			percent = 0;
			count = 0;
			lockedPose = undefined;
			action = PoseEnum.NONE;
			textElement.innerHTML = "Pose: " + PoseEnum.NONE;
		} else { nonePercent += 2.8; }
	}
  canvasCtx.restore();  
}

function drawBasedOnAction(lastPoint, pointerFinger, lineWidth) {
	// If action is not locked then we went draw just yet
	if (!lockedPose || lockedPose === PoseEnum.NONE) return;

	switch (lockedPose) {
		case PoseEnum.OPEN:
			drawLine(ctx, canvasElement1, lastPoint, pointerFinger, lineWidth);
			break;
		case PoseEnum.FIST:
			drawCircle(ctx, canvasElement1, pointerFinger, lineWidth);
			break;
		case PoseEnum.TOGETHER:
			drawSquare(ctx, canvasElement1, pointerFinger, lineWidth);
			break;
		case PoseEnum.ROCK:
			count++;
			drawImage(ctx, canvasElement1, pointerFinger, rockImg, count);
			break;
		case PoseEnum.PEACE:
			count++;
			drawImage(ctx, canvasElement1, pointerFinger, peaceImg, count);
			break;
		case PoseEnum.OK:
			drawSpace(ctx, canvasElement1, lastPoint, pointerFinger, lineWidth, spaceStyle);
			break;
		default:
			return;
	}
}

function determinePose(handLandmarks) {
	if (percent >= 100) {
		lockedPose = action;
		return `Locked Pose: ${action}`;
	}
	// Ring finger folded down
	if (handLandmarks[16].y > handLandmarks[14].y && handLandmarks[15].y > handLandmarks[14].y) {
		// Middle finger pointed down
		if (handLandmarks[12].y > handLandmarks[10].y && handLandmarks[11].y > handLandmarks[10].y) {
			// Pointing && Pinky fingers pointed down && distance between middle finger and thumb small enough
			if (handLandmarks[8].y > handLandmarks[6].y && handLandmarks[7].y > handLandmarks[6].y &&
				handLandmarks[20].y > handLandmarks[18].y && handLandmarks[19].y > handLandmarks[18].y &&
				dis(handLandmarks[12], handLandmarks[4]) < 0.2) {
					action = PoseEnum.FIST;
			} 
			// Pointing && Pinky fingers pointed up
			else if (handLandmarks[8].y < handLandmarks[6].y && handLandmarks[7].y < handLandmarks[6].y &&
					handLandmarks[20].y < handLandmarks[18].y && handLandmarks[19].y < handLandmarks[18].y) {
						action = PoseEnum.ROCK;
			} else {
				action = PoseEnum.NONE;
			}
		}

		// Pinky finbger pointed down && Pointer finger pointed up && Distance between middle & pointer finger large enough
		else if (handLandmarks[20].y > handLandmarks[18].y && handLandmarks[19].y > handLandmarks[18].y &&
				handLandmarks[8].y < handLandmarks[6].y && handLandmarks[7].y < handLandmarks[6].y &&
				dis(handLandmarks[8], handLandmarks[12]) > 0.11) {
					action = PoseEnum.PEACE;
		} else {
			action = PoseEnum.NONE;
		}

		if (action === PoseEnum.NONE) percent = 0;
		else percent += 2.8;
	}
	// Ring && Middle && Pinky finger pointed up
	else if (handLandmarks[12].y < handLandmarks[10].y && handLandmarks[11].y < handLandmarks[10].y &&
			handLandmarks[20].y < handLandmarks[18].y && handLandmarks[19].y < handLandmarks[18].y) {
		// Thumb & Pointer finger ends close together
		if (dis(handLandmarks[4], handLandmarks[8]) < 0.06) {
			percent += 1.8;
			action = PoseEnum.OK;
		}
		// Distance beetween all neighboor fingers (apart from thumb) small enough
		else if (dis(handLandmarks[8], handLandmarks[12]) < 0.08 &&
				dis(handLandmarks[12], handLandmarks[16]) < 0.08 &&
				dis(handLandmarks[15], handLandmarks[20]) < 0.08) {
					percent += 1.8;
					action = PoseEnum.TOGETHER;
		} else {
			percent += 1.8;
			action = PoseEnum.OPEN;
		}
	}

	if (action === PoseEnum.NONE) return "Pose: " + PoseEnum.NONE;
	return `Pose: ${action} - Loading ${Math.floor(percent)}`;
}

function dis(pointA, pointB) {
	dx = pointA.x - pointB.x
	dy = pointA.y - pointB.y
	return Math.sqrt(dx*dx + dy*dy);
}

const hands = new Hands({locateFile: (file) => {
	return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
}});
hands.setOptions({
	maxNumHands: 2,
	minDetectionConfidence: 0.8,
	minTrackingConfidence: 0.8
});
hands.onResults(onResults);

const camera = new Camera(webcamElement, {
	onFrame: async () => {
		await hands.send({image: webcamElement});
	},
	width: 640,
	height: 480
});
camera.start();

function clearCanvas() {
	ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
}

jscolor.trigger("input");
function update(picker) {
	ctx.strokeStyle = ctx.fillStyle = picker.toHEXString();
	socket.emit("colorChange", ctx.strokeStyle);
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

const rockImg = new Image();
rockImg.src = "https://static.thenounproject.com/png/6270-200.png";

const peaceImg = new Image();
peaceImg.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Peace_sign.svg/1200px-Peace_sign.svg.png";

const spaceImg = new Image();
spaceImg.src = "https://lh3.googleusercontent.com/YGJ77qN9KiwctZgfqV8Bf3hNo0rZvcFaPKDTkvtS6kVbtwyCS80Pm6dpXzJCCLZE1Q";
spaceImg.onload = function() {
	spaceStyle = ctx.createPattern(spaceImg, "repeat");
}
