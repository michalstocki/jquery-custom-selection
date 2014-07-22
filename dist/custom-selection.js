/*! CustomSelection - v0.1.0 - 2014-07-22 */var startAnchor = null;
var endAnchor = null;
var startOffset = null;
var endOffset = null;
var startMarker, endMarker;
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
		var eventAnchor = e.touches[0].target;
		startMarker = startMarker || createMarker('marker');
		var markerOffset = mark(eventAnchor, point, startMarker);
		if (markerOffset) {
			startAnchor = startMarker.parentNode;
			startOffset = markerOffset;
		}
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
			var eventAnchor = document.elementFromPoint(lastPoint.clientX, lastPoint.clientY);
			var markerOffset = mark(eventAnchor, lastPoint, endMarker);
			if (markerOffset) {
				endAnchor = endMarker.parentNode;
				endOffset = markerOffset;
			}
			ticking = false;
		});
	}).on('touchend', function(e) {
		e = e.originalEvent;
		logg('touchend: ' + e.touches.length);
		console.log('sA, eA, sO, eO', startAnchor, endAnchor, startOffset, endOffset);
		createSelection();
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

function createSelection() {
	var range = document.createRange();
	range.setStart(startAnchor, startOffset);
	range.setEnd(endAnchor, endOffset);
	window.getSelection().addRange(range);
}

function mark(el, point, marker) {
	var textNode;
	if (textNode = getFromElNodeContainingPoint(el, point)) {
		while (textNode.length > 1) {
			var trimPosition = textNode.length >> 1;
			var subNode = textNode.splitText(trimPosition);
			if (nodeContainsPoint(subNode, point)) {
				textNode = subNode;
			}
		}
		putMarkerBefore(textNode, marker);
	} else if (textNode = getClosestTextNodeFromEl(el, point)) {
		putMarkerAfter(textNode, marker);
	} else {
		return null;
	}
	marker.parentNode.normalize();
	return getIndexOfElement(marker);
}

function putMarkerBefore(node, marker) {
	node.parentNode.insertBefore(marker, node);
}

function putMarkerAfter(node, marker) {
	if (node.nextSibling) {
		node.parentNode.insertBefore(marker, node.nextSibling);
	} else {
		node.parentNode.appendChild(marker);
	}
}

function createMarker(kind) {
	var span = document.createElement('span');
	span.setAttribute('class', kind);
	return span;
}

function getIndexOfElement(element) {
	var elements = element.parentElement.childNodes;
	return Array.prototype.indexOf.call(elements, element);
}

// -- Finding nearest text node ------------------------------------------------
// Finding node containing point

function getFromElNodeContainingPoint(el, point) {
	var nodes = el.childNodes;
	for (var i = 0, n; n = nodes[i++];) {
		if (nodeIsText(n) && nodeContainsPoint(n, point)) {
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

function nodeIsText(node) {
	return node.nodeType === Node.TEXT_NODE && node.length;
}

// Finding node closest to pointer

function getClosestTextNodeFromEl(el, point) {
	var node = el;
	var subNode;
	while (subNode = getClosestNodeFromEl(node, point)) {
		if (nodeIsText(subNode)) {
			return subNode;
		} else {
			node = subNode;
		}
	}
	return null;
}

function getClosestNodeFromEl(el, point) {
	var nodes = el.childNodes;
	var closestNode = null;
	for (var i = 0, n; n = nodes[i++];) {
		var rects;
		if ((rects = getRectsForNode(n)) && rects.length) {
			closestNode = closestNode || n;
			closestNode = getNodeCloserToPoint(point, closestNode, n);
		}
	}
	return closestNode;
}

function getNodeCloserToPoint(point, winner, rival) {
	var nearestWinnerRect = getRectNearestToPoint(winner, point);
	var nearestRivalRect = getRectNearestToPoint(rival, point);
	if (nearestRivalRect && nearestWinnerRect &&
		nearestRivalRect !== nearestWinnerRect &&
		nearestRivalRect.top >= nearestWinnerRect.top) {
		return rival;
	} else {
		return winner;
	}
}

function getRectNearestToPoint(node, point) {
	var y = point.clientY;
	var rects = getRectsForNode(node);
	var nearestRect = null;
	for (var j = 0, rect; rect = rects[j++];) {
		if (rect.top < y) {
			nearestRect = nearestRect || rect;
			if (nearestRect !== rect && rect.top >= nearestRect.top) {
				nearestRect = rect;
			}
		}
	}
	return nearestRect;
}



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
	context.arc(x, y, 12, 0, 2 * Math.PI, false);
	context.lineWidth = 2;
	context.strokeStyle = 'green';
	context.stroke();
}
/* jshint+W098 */