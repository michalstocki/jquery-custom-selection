var startAnchor = $('li:nth-child(3)')[0];
var endAnchor = $('li:nth-child(6)')[0];
var startOffset = null;
var endOffset = null;
var $startMarker, $endMarker;
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
		$startMarker = $startMarker || createMarker('marker');
		startOffset = mark(startAnchor, point, $startMarker);
		e.preventDefault();
	}).on('touchmove', function(e) {
		e.preventDefault();
		e = e.originalEvent;
		var touch = e.touches[0];
		lastPoint = {
			clientX: touch.clientX,
			clientY: touch.clientY,
			pageX: touch.pageX,
			pageY: touch.pageY
		};
		requestTick(function() {
			$endMarker = $endMarker || createMarker('marker_end');
			endAnchor = document.elementFromPoint(lastPoint.clientX, lastPoint.clientY);
			endOffset = mark(endAnchor, lastPoint, $endMarker);
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

function mark(el, point, $marker) {
	var textNode = getNodeFromElByPoint(el, point);
	var distanceY = getNodeDistanceY(textNode, point);
	var furtherDistanceY = distanceY;

	var subNode;
	while ((subNode = textNode.splitText(1)) && subNode.length &&
		(furtherDistanceY = getNodeDistanceY(subNode, point)) &&
		furtherDistanceY <= distanceY) {

		distanceY = furtherDistanceY;
		textNode = subNode;
	}

	var distanceX = getNodeDistanceX(textNode, point);
	var furtherDistanceX = distanceX - 1;
	furtherDistanceY = distanceY;

	var previousNode;
	while ((previousNode = getPreviousTextNode(textNode)) &&
		(furtherDistanceX = getNodeDistanceX(previousNode, point)) &&
		furtherDistanceX <= distanceX &&
		(furtherDistanceY = getNodeDistanceY(previousNode, point)) &&
		furtherDistanceY === distanceY) {

		distanceX = furtherDistanceX;
		textNode = previousNode;
	}

	putMarkerBefore(textNode, $marker);
	el.normalize();
	var childOffset = $(el).contents().toArray().indexOf($marker[0]);
	return childOffset;
}

function getNodeDistanceY(textNode, point) {
	var range = document.createRange();
	range.selectNode(textNode);
	var rects = range.getClientRects();
	var rect = {};
	for (var i = 0; i < rects.length && !rect.top; i++) {
		rect = rects[i];
	}
	if (!rect.top) {
		console.error(textNode, textNode.data);
	}
	var centerY = rect.top + rect.height / 2;
	return Math.abs(centerY - point.clientY);
}

function getNodeDistanceX(textNode, point) {
	var range = document.createRange();
	range.selectNode(textNode);
	var rects = range.getClientRects();
	var rect = {};
	for (var i = 0; i < rects.length && !rect.left; i++) {
		rect = rects[i];
	}
	if (!rect.left) {
		console.error(textNode, textNode.data);
	}
	return Math.abs(rect.left - point.clientX);
}

function getMarkerDistanceY(point, $marker) {
	var markerOffset = $marker.offset();
	var markerY = markerOffset.top + 6;
	return Math.abs(markerY - point.pageY);
}

function getMarkerDistanceX(point, $marker) {
	var markerOffset = $marker.offset();
	var markerX = markerOffset.left - 2;
	return Math.abs(markerX - point.pageX);
}

function getPreviousTextNode(textNode) {
	while (textNode.previousSibling) {
		textNode = textNode.previousSibling;
		if (textNode.nodeType === Node.TEXT_NODE) {
			return textNode;
		}
	}
	return null;
}

function logg(m) {
	$('.touch_status').text(m);
}

function putMarkerBefore(node, $marker) {
	$marker.insertBefore(node);
}

function getNodeFromElByPoint(el, point) {
	var x = point.clientX, y = point.clientY;
	var nodes = el.childNodes;
	var firstText;
	for (var i = 0, n; n = nodes[i++];) {
		if (n.nodeType === Node.TEXT_NODE) {
			firstText = firstText || n;
			var r = document.createRange();
			r.selectNode(n);
			var rects = r.getClientRects();
			for (var j = 0, rect; rect = rects[j++];) {
				if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
					return n;
				}
			}
		}
	}
	if (firstText) {
		console.log('no hovered text node found, returning: ', firstText);
		//TODO: find nearest text node.
	} else {
		console.log('no text node found');
	}
	return firstText;
}

function createMarker(kind) {
	return $('<span class="' + kind + '"></span>');
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

