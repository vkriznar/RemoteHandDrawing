const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext("2d");

const canvasElement1 = document.getElementById('canvas1');
const canvasCtx1 = canvasElement1.getContext("2d");
canvasCtx1.lineWidth = 6;

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
