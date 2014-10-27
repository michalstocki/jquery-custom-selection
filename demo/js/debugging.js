
function logg(m) {
	$('.touch_status').text(m);
}

// -- Drawing on canvas --------------------------------------------------------

var context;


/* jshint-W098 */
function initCanvas() {
	var canvas = getCanvas() || createCanvas();
	canvas.width = $(window).width();
	canvas.height = $(window).height();
	context = canvas.getContext('2d');
}

function drawNode(n, color) {
	var r = document.createRange();
	r.selectNode(n);
	var rects = r.getClientRects();
	for (var j = 0, rect; rect = rects[j++];) {
		drawRect(rect, color);
	}
}

function drawRect(rect, color) {
	context.beginPath();
	context.rect(rect.left + 0.5, rect.top + 0.5, rect.width, rect.height);
	context.lineWidth = 1;
	context.strokeStyle = color || 'red';
	context.stroke();
}

function drawRange(range, color) {
	var rects = range.getClientRects();
	for (var j = 0, rect; rect = rects[j++];) {
		drawRect(rect, color);
	}
}

function drawPoint(point, color) {
	drawCircle(point.clientX, point.clientY, color);
}

function drawCircle(x, y, color) {
	context.beginPath();
	context.arc(x, y, 10, 0, 2 * Math.PI, false);
	context.lineWidth = 2;
	context.strokeStyle = color || 'green';
	context.stroke();
}

// helpers

function getCanvas() {
	return document.getElementById('debugging');
}

function createCanvas() {
	var canvas = document.createElement('canvas');
	canvas.setAttribute('id', 'debugging');
	document.body.insertBefore(canvas, document.body.firstElementChild);
	return canvas;
}
/* jshint+W098 */
