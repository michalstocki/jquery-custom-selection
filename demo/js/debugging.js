
function logg(m) {
	$('.touch_status').text(m);
}

// -- Drawing on canvas --------------------------------------------------------

var context;


/* jshint-W098 */
function initCanvas() {
	var canvas = document.getElementById('debugging');
	canvas.width = $(window).width();
	canvas.height = $(window).height();
	context = canvas.getContext('2d');
}

function drawNode(n) {
	var r = document.createRange();
	r.selectNode(n);
	var rects = r.getClientRects();
	for (var j = 0, rect; rect = rects[j++];) {
		drawRect(rect);
	}
}

function drawRect(rect) {
	context.beginPath();
	context.rect(rect.left + 0.5, rect.top + 0.5, rect.width, rect.height);
	context.lineWidth = 1;
	context.strokeStyle = 'red';
	context.stroke();
}

function drawCircle(x, y) {
	context.beginPath();
	context.arc(x, y, 10, 0, 2 * Math.PI, false);
	context.lineWidth = 2;
	context.strokeStyle = 'green';
	context.stroke();
}
/* jshint+W098 */
