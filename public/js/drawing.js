function drawLine(ctx, canvasEle, pointA, pointB, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(pointA[0] * canvasEle.width, pointA[1] * canvasEle.height);
    ctx.lineTo(pointB[0] * canvasEle.width, pointB[1] * canvasEle.height);
    ctx.stroke();
}

function drawCircle(ctx, canvasEle, point, size) {
    radius = 8 + size;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point[0] * canvasEle.width, point[1] * canvasEle.height, radius, false, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
}

function drawSquare(ctx, canvasEle, point, size) {
    diag = 8 + size;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(point[0] * canvasEle.width - diag, point[1] * canvasEle.height - diag, diag * 2, diag * 2);
    ctx.fill();
    ctx.stroke();
}

function drawImage(ctx, canvasEle, point, img, count) {
    if (count % 3 !== 0) return;
    ctx.drawImage(img, point[0] * canvasEle.width - 32, point[1] * canvasEle.height - 32, 64, 64);
}

function drawSpace(ctx, canvasEle, pointA, pointB, lineWidth, strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 10 + lineWidth;

    ctx.beginPath();
    ctx.moveTo(pointA[0] * canvasEle.width, pointA[1] * canvasEle.height);

    const midPoint = [
        pointA[0] * canvasEle.width + (pointB[0] * canvasEle.width - pointA[0] * canvasEle.width) / 2,
        pointA[1] * canvasEle.height + (pointB[1] * canvasEle.height - pointA[1] * canvasEle.height) / 2
    ];
    ctx.quadraticCurveTo(pointA[0] * canvasEle.width, pointA[1] * canvasEle.height, midPoint[0], midPoint[1]);

    ctx.lineTo(pointB[0] * canvasEle.width, pointB[1] * canvasEle.height);
    ctx.stroke();
}