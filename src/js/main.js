var startAnchor = $('li:nth-child(3)')[0];
var endAnchor = $('li:nth-child(6)')[0];
var startOffset = null;
var endOffset = null;
var startMarker, endMarker;
var context;
var lastPoint, ticking = false;

$(function() {
	$('body').on('touchstart', function(e) {
		e = e.originalEvent;
		logg('touchstart: ' + e.touches.length);
		window.getSelection().removeAllRanges();
		removeMarkers();
		var touch = e.touches[0];
		var point = {
			clientX: touch.clientX,
			clientY: touch.clientY,
			pageX: touch.pageX,
			pageY: touch.pageY
		};
		startAnchor = e.touches[0].target;
		startMarker = startMarker || createMarker('marker');
		startOffset = mark(startAnchor, point, startMarker);
		e.preventDefault();
	}).on('touchmove', function(e) {
		e.preventDefault();
		e = e.originalEvent;
		logg('touchmove: ' + e.touches[0].clientX + '/' + e.touches[0].clientY);
		var touch = e.touches[0];
		lastPoint = {
			clientX: touch.clientX,
			clientY: touch.clientY,
			pageX: touch.pageX,
			pageY: touch.pageY
		};
		requestTick(function() {
			endMarker = endMarker || createMarker('marker_end');
			var markerAnchor = document.elementFromPoint(lastPoint.clientX, lastPoint.clientY);
			var markerOffset = mark(markerAnchor, lastPoint, endMarker);
			if (markerOffset) {
				endAnchor = markerAnchor;
				endOffset =  markerOffset;
			}
			ticking = false;
		});
	}).on('touchend', function(e) {
		e = e.originalEvent;
		logg('touchend: ' + e.touches.length);
		console.log('sA, eA, sO, eO', startAnchor, endAnchor, startOffset, endOffset);
		window.createSelection();
	});
});

function removeMarkers() {
	$('.marker').remove();
	$('.marker_end').remove();
}

function requestTick(func) {
	if (!ticking) {
		window.requestAnimationFrame(func);
	}
	ticking = true;
}

window.createSelection = function() {
	var range = document.createRange();
	range.setStart(startAnchor, startOffset);
	range.setEnd(endAnchor, endOffset);
	window.getSelection().addRange(range);
};

function mark(el, point, marker) {
	var textNode = getNodeFromElByPoint(el, point);
	if (!textNode) {
		return null;
	}

	while (textNode.length > 1) {
		var trimPosition = textNode.length >> 1;
		var subNode = textNode.splitText(trimPosition);
		if (nodeContainsPoint(subNode, point)) {
			textNode = subNode;
		}
	}

	putMarkerBefore(textNode, marker);
	el.normalize();
	return Array.prototype.indexOf.call(el.childNodes, marker);
}

function logg(m) {
	$('.touch_status').text(m);
}

function putMarkerBefore(node, marker) {
	node.parentNode.insertBefore(marker, node);
}

function createMarker(kind) {
	var span = document.createElement('span');
	span.setAttribute('class', kind);
	return span;
}

// -- Finding nearest text node ------------------------------------------------

function getNodeFromElByPoint(el, point) {
	var nodes = el.childNodes;
	for (var i = 0, n; n = nodes[i++];) {
		if (n.nodeType === Node.TEXT_NODE && nodeContainsPoint(n, point)) {
			return n;
		}
	}
}

function nodeContainsPoint(node, point) {
	var rects = getRectsForNode(node);
	for (var j = 0, rect; rect = rects[j++];) {
		if (rectContainsPoint(rect, point)) {
			return true;
		}
	}
}

function getRectsForNode(node) {
	var range = document.createRange();
	range.selectNode(node);
	return range.getClientRects();
}

function rectContainsPoint(rect, point) {
	var x = point.clientX, y = point.clientY;
	return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

// -- Bisect ------------------------------------------------------------------

function bisectWithoutAccessor(f, x, lo, hi) {
	while (lo < hi) {
		var mid = (lo + hi) >> 1;
		if (x < f(mid)) hi = mid;
		else lo = mid + 1;
	}
	return lo;
}

// -- Drawing rectangles ------------------------------------------------------

function drawNode(n) {
	var r = document.createRange();
	r.selectNode(n);
	var rects = r.getClientRects();
	for (var j = 0, rect; rect = rects[j++];) {
		drawRect(rect);
	}
}

function initCanvas() {
	var canvas = document.getElementById('debugging');
	canvas.width = $(window).width();
	canvas.height = $(window).height();
	context = canvas.getContext('2d');
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
	context.arc(x, y, 12, 0, 2 * Math.PI, false);
	context.lineWidth = 2;
	context.strokeStyle = 'green';
	context.stroke();
}

