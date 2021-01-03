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
let resetPercent = 0;
let count = 0;
let points = [];
let lockedPose = null;
let spaceStyle = null;
let rockStyle = null;
rockImages = [];
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

		// Reset canvas if user holds two hands up for a longer period
		if (results.multiHandLandmarks.length > 1) {
			if (resetPercent >= 100) {
				percent = 0;
				count = 0;
				points = [];
				lockedPose = null;
				action = PoseEnum.NONE;
				textElement.innerHTML = "Pose: " + PoseEnum.NONE;
				ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
			} else { resetPercent += 1.8; }
		} else { 
			resetPercent = 0;

			// Determine hand pose
			let handPose = determinePose(results.multiHandLandmarks[0]);

			// If hand pose doesn't equal NONE than increment percent
			if (handPose !== PoseEnum.NONE && handPose !== PoseEnum.FIST && lockedPose === null) {
				percent += 2.8;

				// If percent reaches 100% lock pose and set the text element
				if (percent >= 100) {
					lockedPose = handPose;
					textElement.innerHTML = "Locked Pose: " + handPose;
					if (lockedPose === PoseEnum.ROCK) {
						let random = Math.floor(Math.random() * rockImages.length);
						rockStyle = ctx.createPattern(rockImages[random], "repeat");
						socket.emit("styleChange", lockedPose + "-" + random);
					} else { socket.emit("styleChange", lockedPose); }
					
				} else textElement.innerHTML = `Pose: ${handPose} - Loading ${Math.floor(percent)}`;
			}
			
			if (results.multiHandLandmarks[0][8]) {
				let pointerFinger = [results.multiHandLandmarks[0][8].x, results.multiHandLandmarks[0][8].y];

				if (lastPoint === null) {
					lastPoint = pointerFinger;
				} else {
					// Draw if user is not showing FIST pose since that pose tells the program not to draw
					if (handPose !== PoseEnum.FIST) {
						for (let i = 0; i < 3; i++) {
							// For every pair of fingers close toghether increment line width
							if (dis(results.multiHandLandmarks[0][8 + i*4], results.multiHandLandmarks[0][12 + i*4]) < 0.05)
								lineWidth += 4;
						}

						// Draw based on locked action
						drawBasedOnLockedAction(lastPoint, pointerFinger, lineWidth);
						lastPoint = pointerFinger;
						socket.emit("point", {point: pointerFinger, lineWidth: lineWidth});
					} else { lastPoint = null; }
				}
			}
		}
	} else {
		lastPoint = null;

		if (nonePercent >= 100 && lockedPose !== null) {
			percent = 0;
			count = 0;
			points = [];
			lockedPose = null;
			action = PoseEnum.NONE;
			textElement.innerHTML = "Pose: " + PoseEnum.NONE;
			socket.emit("styleChange", PoseEnum.NONE);
		} else { nonePercent += 1; }
	}
  	canvasCtx.restore();  
}

function drawBasedOnLockedAction(lastPoint, pointerFinger, lineWidth) {
	// If action is not locked then we went draw just yet
	if (!lockedPose || lockedPose === PoseEnum.NONE) return;

	switch (lockedPose) {
		case PoseEnum.OPEN:
			drawLine(ctx, canvasElement1, lastPoint, pointerFinger, lineWidth);
			break;
		case PoseEnum.TOGETHER:
			drawStickingLine(ctx, canvasElement1, pointerFinger, points);
			points.push(pointerFinger);
			break;
		case PoseEnum.ROCK:
			count++;
			drawSpace(ctx, canvasElement1, lastPoint, pointerFinger, lineWidth, rockStyle);
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
	}
	// Ring && Middle && Pinky finger pointed up
	else if (handLandmarks[12].y < handLandmarks[10].y && handLandmarks[11].y < handLandmarks[10].y &&
			handLandmarks[20].y < handLandmarks[18].y && handLandmarks[19].y < handLandmarks[18].y) {
		// Thumb & Pointer finger ends close together
		if (dis(handLandmarks[4], handLandmarks[8]) < 0.06) {
			action = PoseEnum.OK;
		}
		// Distance beetween all neighboor fingers (apart from thumb) small enough
		else if (dis(handLandmarks[8], handLandmarks[12]) < 0.08 &&
				dis(handLandmarks[12], handLandmarks[16]) < 0.08 &&
				dis(handLandmarks[15], handLandmarks[20]) < 0.08) {
					action = PoseEnum.TOGETHER;
		} else {
			action = PoseEnum.OPEN;
		}
	}

	return action;
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
