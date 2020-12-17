const textElement = document.getElementById("pose");
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext("2d");

const canvasElement1 = document.getElementById('canvas1');
const canvasCtx1 = canvasElement1.getContext("2d");
canvasCtx1.lineWidth = 6;
canvasCtx1.lineJoin = canvasCtx1.lineCap = "round";

canvasCtx.translate(canvasElement.width, 0);
canvasCtx.scale(-1, 1);
canvasCtx1.translate(canvasElement.width, 0);
canvasCtx1.scale(-1, 1);

let lastPoint = null;
const socket = io.connect("https://188.230.231.221:3000");

function onResults(results) {  
    // Draw the overlays.
    canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks && results.multiHandedness) {
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

		let handPose = determinePose(results.multiHandLandmarks[0]);
		textElement.innerHTML = handPose;

		if (results.multiHandLandmarks[0][8]) {
			let pointerFinger = [results.multiHandLandmarks[0][8].x, results.multiHandLandmarks[0][8].y];

			if (lastPoint === null) {
				lastPoint = pointerFinger;
			} else {
				canvasCtx1.beginPath();
				canvasCtx1.moveTo(lastPoint[0] * canvasElement.width, lastPoint[1] * canvasElement.height);
				canvasCtx1.lineTo(pointerFinger[0] * canvasElement.width, pointerFinger[1] * canvasElement.height);
				canvasCtx1.stroke();
				lastPoint = pointerFinger;

				socket.emit("point", {x: pointerFinger[0], y: pointerFinger[1]});
			}
		}
    }
  canvasCtx.restore();  
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
				return "FIST";
			} 
			// Pointing && Pinky fingers pointed up
			else if (handLandmarks[8].y < handLandmarks[6].y && handLandmarks[7].y < handLandmarks[6].y &&
					handLandmarks[20].y < handLandmarks[18].y && handLandmarks[19].y < handLandmarks[18].y) {
				return "ROCK'N'ROLL";
			} else { return undefined; }
		}

		// Pinky finbger pointed down && Pointer finger pointed up && Distance between middle & pointer finger large enough
		else if (handLandmarks[20].y > handLandmarks[18].y && handLandmarks[19].y > handLandmarks[18].y &&
				handLandmarks[8].y < handLandmarks[6].y && handLandmarks[7].y < handLandmarks[6].y &&
				dis(handLandmarks[8], handLandmarks[12]) > 0.11) {
			return "PEACE";
		} else { return undefined; }
	}
	// Ring && Middle && Pinky finger pointed up
	else if (handLandmarks[12].y < handLandmarks[10].y && handLandmarks[11].y < handLandmarks[10].y &&
			handLandmarks[20].y < handLandmarks[18].y && handLandmarks[19].y < handLandmarks[18].y) {
		// Thumb & Pointer finger ends close together
		if (dis(handLandmarks[4], handLandmarks[8]) < 0.06) {
			return "OK";
		}
		// Distance beetween all neighboor fingers (apart from thumb) small enough
		else if (dis(handLandmarks[8], handLandmarks[12]) < 0.10 &&
				dis(handLandmarks[12], handLandmarks[16]) < 0.10 &&
				dis(handLandmarks[15], handLandmarks[20]) < 0.10) {
			return "PALM_TOGHETHER";
		} else {
			return "PALM_OPEN";
		}
	}
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
	maxNumHands: 1,
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
	canvasCtx1.clearRect(0, 0, canvasElement.width, canvasElement.height);
}

jscolor.trigger("input");
function update(picker) {
	canvasCtx1.strokeStyle = picker.toHEXString();
	socket.emit("colorChange", canvasCtx1.strokeStyle);
}
