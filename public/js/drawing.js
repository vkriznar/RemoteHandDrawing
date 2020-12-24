function drawLine(ctx, canvasEle, pointA, pointB, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(pointA[0] * canvasEle.width, pointA[1] * canvasEle.height);
    ctx.lineTo(pointB[0] * canvasEle.width, pointB[1] * canvasEle.height);
    ctx.stroke();
}

function drawStickingLine(ctx, canvasEle, point, points) {
    ctx.lineWidth = 2;
    let w = canvasEle.width;
    let h = canvasEle.height;

    for (let i=0; i < points.length; i++) {
        dx = point[0] - points[i][0];
        dy = point[1] - points[i][1];
        d =  Math.sqrt(dx*dx + dy*dy);

        if (d < 0.06) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.moveTo(lastPoint[0]*w + (dx * 0.2 * w), lastPoint[1]*h + (dy * 0.2 * h));
            ctx.lineTo(points[i][0]*w - (dx * 0.2 * w), points[i][1]*h - (dy * 0.2 * h));
            ctx.stroke();
        }
    }
}

function drawImage(ctx, canvasEle, point, img, count) {
    if (count % 3 !== 0) return;
    ctx.drawImage(img, point[0] * canvasEle.width - 32, point[1] * canvasEle.height - 32, 64, 64);
}

function drawSpace(ctx, canvasEle, pointA, pointB, lineWidth, strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 16 + lineWidth * 2;

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
