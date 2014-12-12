/*! jquery-custom-selection - v0.5.2 - 2014-12-12 */(function() {
  window.CustomSelection = (function() {
    var DEFAULTS;

    DEFAULTS = {
      holdThreshold: 4,
      holdTimeout: 500,
      markerShiftY: 38,
      onSelectionChange: function() {},
      contentOrigin: {
        offsetX: 0,
        offsetY: 0,
        scale: 1
      }
    };

    CustomSelection.prototype._contentContext = null;

    CustomSelection.prototype._contextTranslator = null;

    CustomSelection.prototype._selectionApplier = null;

    CustomSelection.prototype._pointerEventBinder = null;

    CustomSelection.prototype._element = null;

    CustomSelection.prototype._settings = null;

    function CustomSelection(_element, options) {
      this._element = _element;
      this._settings = $.extend(DEFAULTS, options);
      this._injectDependencies();
      this._contextTranslator.setContentTransformationFromMarkersContext(this._settings.contentOrigin);
      this._contentContext.disableNativeSelection();
      this._selectionApplier.clearSelection();
    }

    CustomSelection.prototype.refresh = function(transformation) {
      if (transformation != null) {
        this._contextTranslator.setContentTransformationFromMarkersContext(transformation);
      }
      return this._selectionApplier.refreshSelection();
    };

    CustomSelection.prototype.clear = function() {
      return this._selectionApplier.clearSelection();
    };

    CustomSelection.prototype.destroy = function() {
      this._selectionApplier.clearSelection();
      this._pointerEventBinder.destroyBindings();
      return this._contentContext.restoreNativeSelection();
    };

    CustomSelection.prototype._injectDependencies = function() {
      var Package, belowPointSnapper, boundFactory, endMarker, environment, frameRequester, hammerAdapter, lastSelection, markersWrapper, movingMarker, nodeUtil, pointFactory, pointLocator, pointTargetLocator, pointToRangeConverter, pointerEventBus, rectangler, rightPointSnapper, selectionConstructor, selectionDrawer, selectionRangeBuilder, startMarker, wordRangeBuilder;
      environment = this._performEnvTests();
      nodeUtil = new CustomSelection.Lib.Utils.NodeUtil();
      frameRequester = new CustomSelection.Lib.FrameRequester();
      hammerAdapter = new CustomSelection.Lib.HammerAdapter(this._settings);
      this._contentContext = new CustomSelection.Lib.ContentContext(this._element);
      this._contextTranslator = new CustomSelection.Lib.ContextTranslator();
      Package = CustomSelection.Lib.Markers;
      startMarker = new Package.StartMarker(this._contentContext, this._contextTranslator, $(this._settings.startMarker)[0]);
      endMarker = new Package.EndMarker(this._contentContext, this._contextTranslator, $(this._settings.endMarker)[0]);
      movingMarker = new Package.MovingMarker(startMarker, endMarker);
      markersWrapper = new Package.MarkersWrapper(startMarker, endMarker);
      Package = CustomSelection.Lib.Drawing;
      rectangler = new Package.Rectangler(environment);
      selectionDrawer = new Package.SelectionDrawer(rectangler, environment, this._contentContext, {
        fillStyle: this._settings.selectionColor,
        markerShiftY: this._settings.markerShiftY
      });
      Package = CustomSelection.Lib.Point;
      pointLocator = new Package.PointLocator(environment, nodeUtil);
      pointTargetLocator = new Package.PointTargetLocator(this._contentContext, nodeUtil, markersWrapper, pointLocator);
      pointFactory = new Package.PointFactory(environment, this._contextTranslator, pointTargetLocator);
      rightPointSnapper = new Package.RightPointSnapper(pointFactory, nodeUtil);
      belowPointSnapper = new Package.BelowPointSnapper(pointFactory, nodeUtil);
      pointToRangeConverter = new Package.PointToRangeConverter(pointLocator, this._contentContext, rightPointSnapper, belowPointSnapper);
      Package = CustomSelection.Lib.Range;
      lastSelection = new Package.LastSelection();
      boundFactory = new Package.SelectionBoundFactory(lastSelection, movingMarker);
      wordRangeBuilder = new Package.WordRangeBuilder(nodeUtil, pointToRangeConverter);
      selectionRangeBuilder = new Package.SelectionRangeBuilder(this._contentContext, pointToRangeConverter, boundFactory, movingMarker);
      selectionConstructor = new Package.SelectionConstructor(this._settings, selectionRangeBuilder, markersWrapper, pointFactory, wordRangeBuilder, frameRequester);
      this._selectionApplier = new CustomSelection.Lib.SelectionApplier(this._settings, lastSelection, markersWrapper, selectionDrawer, this._contentContext);
      pointerEventBus = new CustomSelection.Lib.PointerEventBus(movingMarker, this._selectionApplier, selectionConstructor);
      return this._pointerEventBinder = new CustomSelection.Lib.PointerEventBinder(this._element, hammerAdapter, markersWrapper, pointerEventBus);
    };

    CustomSelection.prototype._performEnvTests = function() {
      var env;
      env = new CustomSelection.Lib.EnvironmentChecker();
      return {
        isWebkit: env.isWebkit(),
        isAppleDevice: env.isAppleDevice(),
        isAndroidLowerThanKitkat: env.isAndroidLowerThan('4.4'),
        isAndroidStackBrowser: env.isAndroidStackBrowser()
      };
    };

    return CustomSelection;

  })();

  window.CustomSelection.Lib = {
    Drawing: {},
    Markers: {},
    Point: {},
    Range: {},
    Utils: {}
  };

}).call(this);

(function() {
  (function($) {
    var DATA_ATTR;
    DATA_ATTR = 'customSelectionInstance';
    $.fn.customSelection = function(options) {
      var customSelection;
      customSelection = new CustomSelection(this[0], options);
      this.first().data(DATA_ATTR, customSelection);
      return this;
    };
    $.fn.refreshCustomSelection = function(contentOrigin) {
      this.first().data(DATA_ATTR).refresh(contentOrigin);
      return this;
    };
    $.fn.clearCustomSelection = function() {
      this.first().data(DATA_ATTR).clear();
      return this;
    };
    return $.fn.disableCustomSelection = function() {
      this.first().data(DATA_ATTR).destroy();
      this.first().data(DATA_ATTR, null);
      return this;
    };
  })(jQuery);

}).call(this);

(function() {
  CustomSelection.Lib.ContentContext = (function() {
    ContentContext.prototype.window = null;

    ContentContext.prototype.document = null;

    ContentContext.prototype.body = null;

    ContentContext.prototype.container = null;

    ContentContext.prototype._originalUserSelectValue = null;

    function ContentContext(container) {
      this.container = container;
      this.document = this.container.ownerDocument;
      this.body = this.document.body;
      this.window = this.document.defaultView || this.document.parentWindow;
    }

    ContentContext.prototype.createRange = function() {
      return this.document.createRange();
    };

    ContentContext.prototype.createElement = function(tagName) {
      return this.document.createElement(tagName);
    };

    ContentContext.prototype.getElementByPoint = function(point) {
      return this.document.elementFromPoint(point.clientX, point.clientY);
    };

    ContentContext.prototype.disableNativeSelection = function() {
      this._originalUserSelectValue = $(this.body).css('user-select');
      return $(this.body).css('user-select', 'none');
    };

    ContentContext.prototype.restoreNativeSelection = function() {
      return $(this.body).css('user-select', this._originalUserSelectValue);
    };

    return ContentContext;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.ContextTranslator = (function() {
    function ContextTranslator() {}

    ContextTranslator.prototype._offsetX = 0;

    ContextTranslator.prototype._offsetY = 0;

    ContextTranslator.prototype._scale = 0;

    ContextTranslator.prototype.setBody = function(body) {
      return this.body = body;
    };

    ContextTranslator.prototype.setContentTransformationFromMarkersContext = function(transformation) {
      this._offsetX = transformation.offsetX;
      this._offsetY = transformation.offsetY;
      return this._scale = transformation.scale;
    };

    ContextTranslator.prototype.contentXToMarkerContext = function(contentX) {
      return contentX * this._scale + this._offsetX;
    };

    ContextTranslator.prototype.contentYToMarkerContext = function(contentY) {
      return contentY * this._scale + this._offsetY;
    };

    ContextTranslator.prototype.scaleToContentContext = function(n) {
      return n / this._scale;
    };

    ContextTranslator.prototype.markersYToContentContext = function(markersY) {
      return this.scaleToContentContext(markersY - this._offsetY);
    };

    ContextTranslator.prototype.markersXToContentContext = function(markersX) {
      return this.scaleToContentContext(markersX - this._offsetX);
    };

    return ContextTranslator;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.EnvironmentChecker = (function() {
    var testUserAgent, userAgentMatch;

    function EnvironmentChecker() {}

    EnvironmentChecker.prototype.isAppleDevice = function() {
      return testUserAgent(/(iPad|iPhone|iPod)/g);
    };

    EnvironmentChecker.prototype.isAndroidStackBrowser = function() {
      return this.isAndroid() && testUserAgent(/Version\/\d\.\d/g);
    };

    EnvironmentChecker.prototype.isAndroidLowerThan = function(versionString) {
      var actualMajor, actualMinor, actualVersion, expectedMajor, expectedMinor, expectedVersion;
      if (!this.isAndroid()) {
        return false;
      }
      expectedVersion = versionString.split('.');
      expectedMajor = Number(expectedVersion[0]);
      expectedMinor = Number(expectedVersion[1]);
      actualVersion = userAgentMatch(/Android (\d)\.(\d)/g);
      actualMajor = Number(actualVersion[1]);
      actualMinor = Number(actualVersion[2]);
      return actualMajor < expectedMajor || (actualMajor === expectedMajor && actualMinor < expectedMinor);
    };

    EnvironmentChecker.prototype.isAndroid = function() {
      return testUserAgent(/Android/g);
    };

    EnvironmentChecker.prototype.isWebkit = function() {
      return testUserAgent(/WebKit/g);
    };

    userAgentMatch = function(regExp) {
      return regExp.exec(window.navigator.userAgent);
    };

    testUserAgent = function(regExp) {
      return regExp.test(window.navigator.userAgent);
    };

    return EnvironmentChecker;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.FrameRequester = (function() {
    function FrameRequester() {}

    FrameRequester.prototype._ticking = false;

    FrameRequester.prototype.requestFrame = function(func) {
      if (!this._ticking) {
        window.requestAnimationFrame((function(_this) {
          return function() {
            func();
            return _this._ticking = false;
          };
        })(this));
      }
      return this._ticking = true;
    };

    return FrameRequester;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.HammerAdapter = (function() {
    HammerAdapter.prototype._bindings = {};

    HammerAdapter.prototype._settings = null;

    function HammerAdapter(_settings) {
      this._settings = _settings;
    }

    HammerAdapter.prototype.bindTapHoldInElement = function(element, callback) {
      var elementBindings, hammer;
      elementBindings = this._getBindingsFor(element);
      hammer = new Hammer.Manager(element, {
        recognizers: [[Hammer.Press]]
      });
      hammer.set({
        holdThreshold: this._settings.holdThreshold,
        holdTimeout: this._settings.holdTimeout
      });
      hammer.on('press', callback);
      return elementBindings.push(hammer);
    };

    HammerAdapter.prototype.bindTapInElement = function(element, callback) {
      var elementBindings, hammer;
      elementBindings = this._getBindingsFor(element);
      hammer = new Hammer.Manager(element, {
        recognizers: [[Hammer.Tap]]
      });
      hammer.on('tap', callback);
      return elementBindings.push(hammer);
    };

    HammerAdapter.prototype.destroyBindingsFor = function(element) {
      var hammer, _i, _len, _ref;
      _ref = this._getBindingsFor(element);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        hammer = _ref[_i];
        hammer.destroy();
      }
      return delete this._bindings[element];
    };

    HammerAdapter.prototype._getBindingsFor = function(element) {
      return this._bindings[element] || (this._bindings[element] = []);
    };

    return HammerAdapter;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.PointerEventBinder = (function() {
    PointerEventBinder.prototype._element = null;

    PointerEventBinder.prototype._hammerAdapter = null;

    PointerEventBinder.prototype._markersWrapper = null;

    PointerEventBinder.prototype._pointerEventBus = null;

    function PointerEventBinder(_element, _hammerAdapter, _markersWrapper, _pointerEventBus) {
      this._element = _element;
      this._hammerAdapter = _hammerAdapter;
      this._markersWrapper = _markersWrapper;
      this._pointerEventBus = _pointerEventBus;
      this._markersWrapper.$markerElements.on('touchstart', this._pointerEventBus.handleMarkerTouchStart);
      this._markersWrapper.$markersBody.on('touchmove', this._pointerEventBus.handleMarkerTouchMove).on('touchend', this._pointerEventBus.handleMarkerTouchMoveEnd);
      $(this._element).on('touchend', this._pointerEventBus.handleGlobalTouchEnd);
      this._hammerAdapter.bindTapHoldInElement(this._element, this._pointerEventBus.handleGlobalTapHold);
      this._hammerAdapter.bindTapInElement(this._element, this._pointerEventBus.handleGlobalTap);
    }

    PointerEventBinder.prototype.destroyBindings = function() {
      this._markersWrapper.$markerElements.off('touchstart', this._pointerEventBus.handleMarkerTouchStart);
      this._markersWrapper.$markersBody.off('touchmove', this._pointerEventBus.handleMarkerTouchMove).off('touchend', this._pointerEventBus.handleMarkerTouchMoveEnd);
      $(this._element).off('touchend', this._pointerEventBus.handleGlobalTouchEnd);
      return this._hammerAdapter.destroyBindingsFor(this._element);
    };

    return PointerEventBinder;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CustomSelection.Lib.PointerEventBus = (function() {
    PointerEventBus.prototype._movingMarker = null;

    PointerEventBus.prototype._selectionApplier = null;

    PointerEventBus.prototype._selectionConstructor = null;

    PointerEventBus.prototype._rejectTouchEnd = false;

    function PointerEventBus(_movingMarker, _selectionApplier, _selectionConstructor) {
      this._movingMarker = _movingMarker;
      this._selectionApplier = _selectionApplier;
      this._selectionConstructor = _selectionConstructor;
      this.handleGlobalTap = __bind(this.handleGlobalTap, this);
      this.handleGlobalTouchEnd = __bind(this.handleGlobalTouchEnd, this);
      this.handleMarkerTouchMoveEnd = __bind(this.handleMarkerTouchMoveEnd, this);
      this.handleMarkerTouchMove = __bind(this.handleMarkerTouchMove, this);
      this.handleMarkerTouchStart = __bind(this.handleMarkerTouchStart, this);
      this.handleGlobalTapHold = __bind(this.handleGlobalTapHold, this);
    }

    PointerEventBus.prototype.handleGlobalTapHold = function(hammerEvent) {
      hammerEvent.srcEvent.preventDefault();
      hammerEvent.srcEvent.stopPropagation();
      return this._selectWordUnderPointer(hammerEvent);
    };

    PointerEventBus.prototype.handleMarkerTouchStart = function(jqueryEvent) {
      jqueryEvent.preventDefault();
      return this._movingMarker.setTo(jqueryEvent.target);
    };

    PointerEventBus.prototype.handleMarkerTouchMove = function(jqueryEvent) {
      if (this._movingMarker.exists()) {
        jqueryEvent.preventDefault();
        this._updateSelectionWithPointerMove(jqueryEvent);
        return this._rejectTouchEnd = true;
      }
    };

    PointerEventBus.prototype.handleMarkerTouchMoveEnd = function() {
      return this._movingMarker.unset();
    };

    PointerEventBus.prototype.handleGlobalTouchEnd = function(jqueryEvent) {
      if (this._rejectTouchEnd) {
        jqueryEvent.preventDefault();
        return this._rejectTouchEnd = false;
      }
    };

    PointerEventBus.prototype.handleGlobalTap = function() {
      return this._selectionApplier.clearSelection();
    };

    PointerEventBus.prototype._selectWordUnderPointer = function(hammerEvent) {
      var range;
      if (range = this._selectionConstructor.getWordSelectionFrom(hammerEvent)) {
        this._movingMarker.unset();
        this._selectionApplier.clearSelection();
        this._selectionApplier.applySelectionFor(range);
        return this._rejectTouchEnd = true;
      }
    };

    PointerEventBus.prototype._updateSelectionWithPointerMove = function(jqueryEvent) {
      return this._selectionConstructor.getSelectionUpdatedWith(jqueryEvent, (function(_this) {
        return function(range) {
          return _this._selectionApplier.applySelectionFor(range);
        };
      })(this));
    };

    return PointerEventBus;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.SelectionApplier = (function() {
    SelectionApplier.prototype._settings = null;

    SelectionApplier.prototype._lastSelection = null;

    SelectionApplier.prototype._markersWrapper = null;

    SelectionApplier.prototype._selectionDrawer = null;

    SelectionApplier.prototype._contentContext = null;

    function SelectionApplier(_settings, _lastSelection, _markersWrapper, _selectionDrawer, _contentContext) {
      this._settings = _settings;
      this._lastSelection = _lastSelection;
      this._markersWrapper = _markersWrapper;
      this._selectionDrawer = _selectionDrawer;
      this._contentContext = _contentContext;
    }

    SelectionApplier.prototype.applySelectionFor = function(range) {
      if (range != null) {
        if (!this._lastSelection.rangeEqualsTo(range)) {
          this._drawSelection(range);
          this._settings.onSelectionChange.call(null, range);
          this._lastSelection.range = range;
        }
        return this._markersWrapper.showMarkers();
      }
    };

    SelectionApplier.prototype.refreshSelection = function() {
      if (this._lastSelection.exists()) {
        return this._drawSelection(this._lastSelection.range);
      }
    };

    SelectionApplier.prototype.clearSelection = function() {
      if (this._lastSelection.exists()) {
        this._selectionDrawer.clearSelection();
        this._settings.onSelectionChange.call(null, this._contentContext.createRange());
      }
      this._markersWrapper.hideMarkers();
      return this._lastSelection.range = null;
    };

    SelectionApplier.prototype._drawSelection = function(range) {
      this._selectionDrawer.redraw(range);
      return this._markersWrapper.alignMarkersToRange(range);
    };

    return SelectionApplier;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Drawing.Rectangler = (function() {
    Rectangler.prototype._environment = null;

    function Rectangler(_environment) {
      this._environment = _environment;
    }

    Rectangler.prototype.getRectsFor = function(range) {
      var rects;
      rects = [].slice.call(range.getClientRects());
      if (this._environment.isWebkit) {
        rects = this._filterDuplicatedRects(rects);
      }
      return rects;
    };

    Rectangler.prototype._filterDuplicatedRects = function(rects) {
      var lastRect;
      lastRect = rects[rects.length - 1];
      return rects.filter(this._isRectUnique.bind(this, rects, lastRect));
    };

    Rectangler.prototype._isRectUnique = function(rects, lastRect, rect) {
      return !this._rectEndsAfterLastRect(rect, lastRect) && !this._rectContainsOneOfRects(rect, rects);
    };

    Rectangler.prototype._rectEndsAfterLastRect = function(rect, lastRect) {
      var TOLERATED_RIGHT_LEAK;
      TOLERATED_RIGHT_LEAK = 1;
      return rect.bottom > lastRect.bottom || (rect.bottom === lastRect.bottom && rect.right - lastRect.right > TOLERATED_RIGHT_LEAK);
    };

    Rectangler.prototype._rectContainsOneOfRects = function(rect, rects) {
      var r, _i, _len;
      for (_i = 0, _len = rects.length; _i < _len; _i++) {
        r = rects[_i];
        if (this._rectContainsNotEmptyRect(rect, r)) {
          return true;
        }
      }
      return false;
    };

    Rectangler.prototype._rectContainsNotEmptyRect = function(possibleParent, potentialChild) {
      var MINIMAL_RECT_HEIGHT, MINIMAL_RECT_WIDTH, R, r;
      MINIMAL_RECT_WIDTH = 2;
      MINIMAL_RECT_HEIGHT = 1;
      R = possibleParent;
      r = potentialChild;
      return !this._rectsAreEqual(R, r) && R.top <= r.top && R.right >= r.right && R.bottom >= r.bottom && R.left <= r.left && r.height >= MINIMAL_RECT_HEIGHT && r.width >= MINIMAL_RECT_WIDTH;
    };

    Rectangler.prototype._rectsAreEqual = function(rectA, rectB) {
      return rectA === rectB || (rectA.left === rectB.left && rectA.right === rectB.right && rectA.height === rectB.height && rectA.width === rectB.width);
    };

    return Rectangler;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Drawing.SelectionDrawer = (function() {
    var CUSTOM_SELECTION_CANVAS_CLASS, CUSTOM_SELECTION_CANVAS_STYLE;

    CUSTOM_SELECTION_CANVAS_CLASS = 'custom-selection-canvas';

    CUSTOM_SELECTION_CANVAS_STYLE = {
      'position': 'absolute',
      'pointer-events': 'none',
      'z-index': -1
    };

    SelectionDrawer.prototype._rectangler = null;

    SelectionDrawer.prototype._environment = null;

    SelectionDrawer.prototype._contentContext = null;

    SelectionDrawer.prototype._settings = null;

    SelectionDrawer.prototype._canvas = null;

    SelectionDrawer.prototype._context = null;

    function SelectionDrawer(_rectangler, _environment, _contentContext, _settings) {
      this._rectangler = _rectangler;
      this._environment = _environment;
      this._contentContext = _contentContext;
      this._settings = _settings;
      this._canvas = this._createCanvas();
      this._context = this._canvas.getContext('2d');
    }

    SelectionDrawer.prototype.redraw = function(range) {
      this._updateCanvasBounds(range.getBoundingClientRect());
      return this._drawSelection(range);
    };

    SelectionDrawer.prototype.clearSelection = function() {
      return this._updateCanvasBounds();
    };

    SelectionDrawer.prototype._drawSelection = function(range) {
      var SUBPIXEL_OFFSET, boundingClientRect, offsetX, offsetY, rect, rects, _i, _len;
      boundingClientRect = range.getBoundingClientRect();
      rects = this._rectangler.getRectsFor(range);
      SUBPIXEL_OFFSET = 0.5;
      offsetX = SUBPIXEL_OFFSET - boundingClientRect.left;
      offsetY = SUBPIXEL_OFFSET - boundingClientRect.top;
      this._context.save();
      this._context.translate(offsetX, offsetY);
      this._context.beginPath();
      for (_i = 0, _len = rects.length; _i < _len; _i++) {
        rect = rects[_i];
        this._context.rect(rect.left, rect.top, rect.width, rect.height);
      }
      this._context.closePath();
      this._context.fillStyle = this._settings.fillStyle;
      this._context.fill();
      return this._context.restore();
    };

    SelectionDrawer.prototype._yOffset = function() {
      if (this._environment.isAppleDevice) {
        return 0;
      } else {
        return $(this._contentContext.window).scrollTop();
      }
    };

    SelectionDrawer.prototype._updateCanvasBounds = function(newBounds) {
      newBounds = newBounds || {
        top: 0,
        left: 0,
        width: 0,
        height: 0
      };
      this._canvas.style.top = (newBounds.top + this._yOffset()) + 'px';
      this._canvas.style.left = newBounds.left + 'px';
      this._canvas.width = newBounds.width;
      return this._canvas.height = newBounds.height;
    };

    SelectionDrawer.prototype._createCanvas = function() {
      var canvas;
      canvas = this._contentContext.createElement('canvas');
      canvas.className = CUSTOM_SELECTION_CANVAS_CLASS;
      $(canvas).css(CUSTOM_SELECTION_CANVAS_STYLE);
      canvas.width = 0;
      canvas.height = 0;
      this._contentContext.container.appendChild(canvas);
      return canvas;
    };

    return SelectionDrawer;

  })();

}).call(this);

(function() {
  var END_MARKER_CLASS, MARKER_CLASS, MOVING_MARKER_CLASS, Marker, START_MARKER_CLASS,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MARKER_CLASS = 'jcs-marker';

  START_MARKER_CLASS = 'jcs-start-marker';

  END_MARKER_CLASS = 'jcs-end-marker';

  MOVING_MARKER_CLASS = 'jcs-marker-moving';

  Marker = (function() {
    Marker.prototype.element = null;

    Marker.prototype.$element = null;

    Marker.prototype.ownerBody = null;

    Marker.prototype._className = '';

    Marker.prototype._contentContext = null;

    Marker.prototype._contextTranslator = null;

    function Marker(_contentContext, _contextTranslator, element) {
      this._contentContext = _contentContext;
      this._contextTranslator = _contextTranslator;
      this.element = element || this._createMarkerElement();
      this.$element = $(this.element);
      this.ownerBody = this.element.ownerDocument.body;
    }

    Marker.prototype.hide = function() {
      return this.$element.css({
        visibility: 'hidden'
      });
    };

    Marker.prototype.show = function() {
      return this.$element.css({
        visibility: 'visible'
      });
    };

    Marker.prototype.disablePointerEvents = function() {
      return this.$element.css('pointer-events', 'none');
    };

    Marker.prototype.enablePointerEvents = function() {
      return this.$element.css('pointer-events', 'auto');
    };

    Marker.prototype.setMoving = function(isMoving) {
      return this.$element.toggleClass(MOVING_MARKER_CLASS, isMoving);
    };

    Marker.prototype.alignToRange = function() {};

    Marker.prototype._createMarkerElement = function() {
      var element;
      element = this._contentContext.createElement('div');
      element.setAttribute('class', MARKER_CLASS + ' ' + this._className);
      element.setAttribute('style', 'position: absolute');
      this._contentContext.container.append(element);
      return element;
    };

    return Marker;

  })();

  CustomSelection.Lib.Markers.StartMarker = (function(_super) {
    __extends(StartMarker, _super);

    function StartMarker() {
      this._className = START_MARKER_CLASS;
      StartMarker.__super__.constructor.apply(this, arguments);
    }

    StartMarker.prototype.alignToRange = function(range) {
      var firstRect;
      firstRect = range.getClientRects()[0];
      return this.$element.css({
        left: this._contextTranslator.contentXToMarkerContext(firstRect.left),
        top: this._contextTranslator.contentYToMarkerContext(firstRect.bottom)
      });
    };

    return StartMarker;

  })(Marker);

  CustomSelection.Lib.Markers.EndMarker = (function(_super) {
    __extends(EndMarker, _super);

    function EndMarker() {
      this._className = END_MARKER_CLASS;
      EndMarker.__super__.constructor.apply(this, arguments);
    }

    EndMarker.prototype.alignToRange = function(range) {
      var lastRect, rects;
      rects = range.getClientRects();
      lastRect = rects[rects.length - 1];
      return this.$element.css({
        left: this._contextTranslator.contentXToMarkerContext(lastRect.right),
        top: this._contextTranslator.contentYToMarkerContext(lastRect.bottom)
      });
    };

    return EndMarker;

  })(Marker);

}).call(this);

(function() {
  CustomSelection.Lib.Markers.MarkersWrapper = (function() {
    MarkersWrapper.prototype.$markerElements = null;

    MarkersWrapper.prototype.$markersBody = null;

    MarkersWrapper.prototype._startMarker = null;

    MarkersWrapper.prototype._endMarker = null;

    function MarkersWrapper(_startMarker, _endMarker) {
      this._startMarker = _startMarker;
      this._endMarker = _endMarker;
      this.$markerElements = this._startMarker.$element.add(this._endMarker.$element);
      this.$markersBody = $(this._startMarker.ownerBody);
    }

    MarkersWrapper.prototype.showMarkers = function() {
      this._startMarker.show();
      return this._endMarker.show();
    };

    MarkersWrapper.prototype.hideMarkers = function() {
      this._startMarker.hide();
      return this._endMarker.hide();
    };

    MarkersWrapper.prototype.alignMarkersToRange = function(range) {
      this._startMarker.alignToRange(range);
      return this._endMarker.alignToRange(range);
    };

    MarkersWrapper.prototype.isMarkerElement = function(element) {
      return element === this._startMarker.element || element === this._endMarker.element;
    };

    return MarkersWrapper;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Markers.MovingMarker = (function() {
    MovingMarker.prototype._startMarker = null;

    MovingMarker.prototype._endMarker = null;

    MovingMarker.prototype._marker = null;

    function MovingMarker(_startMarker, _endMarker) {
      this._startMarker = _startMarker;
      this._endMarker = _endMarker;
    }

    MovingMarker.prototype.setTo = function(markerElement) {
      if (markerElement === this._startMarker.element) {
        this._setMovingStart();
      } else {
        this._setMovingEnd();
      }
      this._startMarker.disablePointerEvents();
      return this._endMarker.disablePointerEvents();
    };

    MovingMarker.prototype.toggleMoving = function() {
      if (this.isStartMarker()) {
        return this._setMovingEnd();
      } else if (this.isEndMarker()) {
        return this._setMovingStart();
      }
    };

    MovingMarker.prototype.unset = function() {
      this._marker = null;
      this._unsetMovingStart();
      this._unsetMovingEnd();
      this._startMarker.enablePointerEvents();
      return this._endMarker.enablePointerEvents();
    };

    MovingMarker.prototype.isStartMarker = function() {
      return this._marker === this._startMarker;
    };

    MovingMarker.prototype.isEndMarker = function() {
      return this._marker === this._endMarker;
    };

    MovingMarker.prototype.exists = function() {
      return this._marker !== null;
    };

    MovingMarker.prototype._setMovingStart = function() {
      this._unsetMovingEnd();
      this._marker = this._startMarker;
      return this._startMarker.setMoving(true);
    };

    MovingMarker.prototype._setMovingEnd = function() {
      this._unsetMovingStart();
      this._marker = this._endMarker;
      return this._endMarker.setMoving(true);
    };

    MovingMarker.prototype._unsetMovingStart = function() {
      return this._startMarker.setMoving(false);
    };

    MovingMarker.prototype._unsetMovingEnd = function() {
      return this._endMarker.setMoving(false);
    };

    return MovingMarker;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Point.Point = (function() {
    Point.prototype.clientX = 0;

    Point.prototype.clientY = 0;

    Point.prototype.pageX = 0;

    Point.prototype.pageY = 0;

    Point.prototype.target = null;

    Point.prototype.isInText = false;

    function Point(pointer, target) {
      this.clientX = pointer.clientX;
      this.clientY = pointer.clientY;
      if (pointer.pageX != null) {
        this.pageX = pointer.pageX;
      }
      if (pointer.pageY != null) {
        this.pageY = pointer.pageY;
      }
      this.target = target.node;
      this.isInText = target.isText;
    }

    return Point;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Point.PointFactory = (function() {
    PointFactory.prototype._contextTranslator = null;

    PointFactory.prototype._environment = null;

    PointFactory.prototype._pointTargetLocator = null;

    function PointFactory(_environment, _contextTranslator, _pointTargetLocator) {
      this._environment = _environment;
      this._contextTranslator = _contextTranslator;
      this._pointTargetLocator = _pointTargetLocator;
    }

    PointFactory.prototype.createFromContentEvent = function(pointerEvent) {
      var pointer, target;
      pointer = this._getPointerFromEvent(pointerEvent);
      target = this._pointTargetLocator.getTargetFromEvent(pointerEvent);
      return new CustomSelection.Lib.Point.Point(pointer, target);
    };

    PointFactory.prototype.createFromMarkerEvent = function(pointerEvent, shiftY) {
      var pointer, target;
      pointer = this._getPointerFromEvent(pointerEvent);
      if (!this._pointerCoordsAutomaticallyScaled()) {
        this._scalePointerCoords(pointer);
      }
      this._shiftPointer(pointer, shiftY);
      target = this._pointTargetLocator.getTargetByCoords(pointer);
      return new CustomSelection.Lib.Point.Point(pointer, target);
    };

    PointFactory.prototype.createFromClientCoordsInText = function(coords, textNode) {
      var target;
      target = {
        node: textNode,
        isText: true
      };
      return new CustomSelection.Lib.Point.Point(coords, target);
    };

    PointFactory.prototype._getPointerFromEvent = function(pointerEvent) {
      var pointers;
      pointers = pointerEvent.touches || pointerEvent.pointers;
      return this._clonePointer(pointers[0]);
    };

    PointFactory.prototype._clonePointer = function(pointer) {
      var coord, newPointer, _i, _len, _ref;
      newPointer = {};
      _ref = ['pageX', 'pageY', 'clientX', 'clientY'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        coord = _ref[_i];
        newPointer[coord] = pointer[coord];
      }
      return newPointer;
    };

    PointFactory.prototype._pointerCoordsAutomaticallyScaled = function() {
      return this._environment.isAndroidStackBrowser && this._environment.isAndroidLowerThanKitkat;
    };

    PointFactory.prototype._scalePointerCoords = function(pointer) {
      pointer.clientX = this._contextTranslator.markersXToContentContext(pointer.clientX);
      pointer.clientY = this._contextTranslator.markersYToContentContext(pointer.clientY);
      pointer.pageX = this._contextTranslator.markersXToContentContext(pointer.pageX);
      return pointer.pageY = this._contextTranslator.markersYToContentContext(pointer.pageY);
    };

    PointFactory.prototype._shiftPointer = function(pointer, shiftY) {
      shiftY = this._contextTranslator.scaleToContentContext(shiftY);
      pointer.pageY = pointer.pageY + shiftY;
      return pointer.clientY = pointer.clientY + shiftY;
    };

    return PointFactory;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Point.PointLocator = (function() {
    PointLocator.prototype._environment = null;

    PointLocator.prototype._nodeUtil = null;

    function PointLocator(_environment, _nodeUtil) {
      this._environment = _environment;
      this._nodeUtil = _nodeUtil;
    }

    PointLocator.prototype.rangeContainsPoint = function(range, point) {
      var rect, _i, _len, _ref;
      _ref = range.getClientRects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rect = _ref[_i];
        if (this._rectContainsPoint(rect, point)) {
          return true;
        }
      }
      return false;
    };

    PointLocator.prototype.nodeContainsPoint = function(node, point) {
      var rect, _i, _len, _ref;
      _ref = this._nodeUtil.getRectsForNode(node);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rect = _ref[_i];
        if (this._rectContainsPoint(rect, point)) {
          return true;
        }
      }
      return false;
    };

    PointLocator.prototype._rectContainsPoint = function(rect, point) {
      return this._rectContainsPointVertically(rect, point) && this._rectOrItsBoundsContainPointHorizontally(rect, point);
    };

    PointLocator.prototype._rectContainsPointVertically = function(rect, point) {
      var y;
      y = this._environment.isAppleDevice ? point.pageY : point.clientY;
      return y > rect.top && y < rect.bottom;
    };

    PointLocator.prototype._rectOrItsBoundsContainPointHorizontally = function(rect, point) {
      var x;
      x = this._environment.isAppleDevice ? point.pageX : point.clientX;
      return x >= rect.left && x <= rect.right;
    };

    return PointLocator;

  })();

}).call(this);

(function() {
  var PointSnapper,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PointSnapper = (function() {
    PointSnapper.prototype._pointFactory = null;

    PointSnapper.prototype._nodeUtil = null;

    function PointSnapper(_pointFactory, _nodeUtil) {
      this._pointFactory = _pointFactory;
      this._nodeUtil = _nodeUtil;
    }

    PointSnapper.prototype.snapPointToTextInElement = function(point, element) {
      var newPoint, position;
      newPoint = null;
      if (position = this._searchPositionInTextByPoint(element, point)) {
        newPoint = this._createPointAt(position);
      }
      return newPoint;
    };

    PointSnapper.prototype._searchPositionInTextByPoint = function(el, point) {
      var node, position;
      node = el;
      while (position = this._searchPositionWithin(node, point)) {
        if (this._nodeUtil.nodeIsText(position.node)) {
          return position;
        } else {
          node = position.node;
        }
      }
      return null;
    };

    PointSnapper.prototype._searchPositionWithin = function(element, point) {
      var node, position, _i, _len, _ref;
      position = null;
      _ref = (element != null ? element.childNodes : void 0) || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (this._nodeMightBeClosest(node)) {
          position = this._getPositionCloserToPoint(position, node, point);
        }
      }
      return position;
    };

    PointSnapper.prototype._getPositionCloserToPoint = function(winningPosition, rivalingNode, point) {
      var newWinner, rivalingRect;
      newWinner = winningPosition;
      rivalingRect = this._getClosestRectFromNode(rivalingNode, point);
      if (this._rivalingRectWins(winningPosition, rivalingRect)) {
        newWinner = {
          node: rivalingNode,
          rect: rivalingRect
        };
      }
      return newWinner;
    };

    PointSnapper.prototype._rivalingRectWins = function(winningPosition, rivalingRect) {
      return ((winningPosition != null) && this._isRivalingRectCloser(rivalingRect, winningPosition.rect)) || ((winningPosition == null) && (rivalingRect != null));
    };

    PointSnapper.prototype._isRivalingRectCloser = function(rivalingRect, winningRect) {
      return (rivalingRect != null) && (winningRect != null) && rivalingRect !== winningRect && this._getCloserRect(rivalingRect, winningRect) === rivalingRect;
    };

    PointSnapper.prototype._nodeMightBeClosest = function(node) {
      return this._nodeUtil.nodeHasRects(node) && (this._nodeUtil.nodeHasChildren(node) || this._nodeUtil.nodeIsText(node));
    };

    PointSnapper.prototype._createPointAt = function(position) {
      return this._pointFactory.createFromClientCoordsInText({
        clientX: position.rect.right - 1,
        clientY: position.rect.bottom - 1
      }, position.node);
    };

    return PointSnapper;

  })();

  CustomSelection.Lib.Point.RightPointSnapper = (function(_super) {
    __extends(RightPointSnapper, _super);

    function RightPointSnapper() {
      return RightPointSnapper.__super__.constructor.apply(this, arguments);
    }

    RightPointSnapper.prototype._getClosestRectFromNode = function(node, point) {
      var nearestRect, rect, rects, _i, _len;
      rects = this._nodeUtil.getRectsForNode(node);
      nearestRect = null;
      for (_i = 0, _len = rects.length; _i < _len; _i++) {
        rect = rects[_i];
        if (this._rectIsInTheSameLineOnLeft(rect, point) && (!nearestRect || rect.right > nearestRect.right)) {
          nearestRect = rect;
        }
      }
      return nearestRect;
    };

    RightPointSnapper.prototype._getCloserRect = function(rectA, rectB) {
      if (rectA.right > rectB.right) {
        return rectA;
      } else if (rectB.right > rectA.right) {
        return rectB;
      } else {
        return null;
      }
    };

    RightPointSnapper.prototype._rectIsInTheSameLineOnLeft = function(rect, point) {
      var x, y;
      x = point.clientX;
      y = point.clientY;
      return rect.right < x && rect.top <= y && rect.bottom >= y;
    };

    return RightPointSnapper;

  })(PointSnapper);

  CustomSelection.Lib.Point.BelowPointSnapper = (function(_super) {
    __extends(BelowPointSnapper, _super);

    function BelowPointSnapper() {
      return BelowPointSnapper.__super__.constructor.apply(this, arguments);
    }

    BelowPointSnapper.prototype._getClosestRectFromNode = function(node, point) {
      var nearestRect, rect, rects, y, _i, _len;
      y = point.clientY;
      rects = this._nodeUtil.getRectsForNode(node);
      nearestRect = null;
      for (_i = 0, _len = rects.length; _i < _len; _i++) {
        rect = rects[_i];
        if (rect.top < y && (!nearestRect || rect.top >= nearestRect.top)) {
          nearestRect = rect;
        }
      }
      return nearestRect;
    };

    BelowPointSnapper.prototype._getCloserRect = function(rectA, rectB) {
      if (rectA.top >= rectB.top) {
        return rectA;
      } else if (rectB.top > rectA.top) {
        return rectB;
      } else {
        return null;
      }
    };

    return BelowPointSnapper;

  })(PointSnapper);

}).call(this);

(function() {
  CustomSelection.Lib.Point.PointTargetLocator = (function() {
    PointTargetLocator.prototype._contentContext = null;

    PointTargetLocator.prototype._nodeUtil = null;

    PointTargetLocator.prototype._markersWrapper = null;

    PointTargetLocator.prototype._pointLocator = null;

    function PointTargetLocator(_contentContext, _nodeUtil, _markersWrapper, _pointLocator) {
      this._contentContext = _contentContext;
      this._nodeUtil = _nodeUtil;
      this._markersWrapper = _markersWrapper;
      this._pointLocator = _pointLocator;
    }

    PointTargetLocator.prototype.getTargetFromEvent = function(pointerEvent) {
      var pointer, textNode;
      pointer = this._getPointerFromEvent(pointerEvent);
      textNode = this._locateTextNodeWithinElementByCoords(pointer.target, pointer);
      return {
        node: textNode || pointer.target,
        isText: textNode != null
      };
    };

    PointTargetLocator.prototype.getTargetByCoords = function(coords) {
      var targetElement, textNode;
      targetElement = this._getTargetElementByCoords(coords);
      textNode = this._locateTextNodeWithinElementByCoords(targetElement, coords);
      return {
        node: textNode || targetElement,
        isText: textNode != null
      };
    };

    PointTargetLocator.prototype._getTargetElementFromPointerEvent = function(pointerEvent) {
      return this._getPointerFromEvent(pointerEvent).target;
    };

    PointTargetLocator.prototype._getTargetElementByCoords = function(coords) {
      var element;
      this._markersWrapper.hideMarkers();
      element = this._contentContext.getElementByPoint(coords) || this._contentContext.body;
      this._markersWrapper.showMarkers();
      return element;
    };

    PointTargetLocator.prototype._getPointerFromEvent = function(pointerEvent) {
      return (pointerEvent.touches || pointerEvent.pointers)[0];
    };

    PointTargetLocator.prototype._locateTextNodeWithinElementByCoords = function(element, pointer) {
      var child, children, _i, _len;
      children = element.childNodes;
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        if (this._isPointerInText(child, pointer)) {
          return child;
        }
      }
      return null;
    };

    PointTargetLocator.prototype._isPointerInText = function(node, point) {
      return this._nodeUtil.nodeIsText(node) && this._pointLocator.nodeContainsPoint(node, point);
    };

    return PointTargetLocator;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Point.PointToRangeConverter = (function() {
    PointToRangeConverter.prototype._pointLocator = null;

    PointToRangeConverter.prototype._contentContext = null;

    PointToRangeConverter.prototype._rightPointSnapper = null;

    PointToRangeConverter.prototype._belowPointSnapper = null;

    function PointToRangeConverter(_pointLocator, _contentContext, _rightPointSnapper, _belowPointSnapper) {
      this._pointLocator = _pointLocator;
      this._contentContext = _contentContext;
      this._rightPointSnapper = _rightPointSnapper;
      this._belowPointSnapper = _belowPointSnapper;
    }

    PointToRangeConverter.prototype.pointToRange = function(point) {
      var endIndex, maxIndex, middle, range, startIndex;
      range = this._contentContext.createRange();
      startIndex = 0;
      maxIndex = point.target.data.length;
      endIndex = maxIndex;
      while (startIndex < endIndex) {
        middle = (startIndex + endIndex) >> 1;
        range.setStart(point.target, startIndex);
        range.setEnd(point.target, middle + 1);
        if (this._pointLocator.rangeContainsPoint(range, point)) {
          endIndex = middle;
        } else {
          startIndex = middle + 1;
          range.setStart(point.target, startIndex);
          range.setEnd(point.target, endIndex);
        }
      }
      if (range.collapsed && range.endOffset < maxIndex) {
        range.setEnd(point.target, range.endOffset + 1);
      }
      return range;
    };

    PointToRangeConverter.prototype.pointToRangeAnchor = function(point) {
      var pointAnchor;
      pointAnchor = null;
      if (point.isInText) {
        pointAnchor = this._getStartAnchorOf(this.pointToRange(point));
      } else if (point = this._snapPointToText(point)) {
        pointAnchor = this._getEndAnchorOf(this.pointToRange(point));
      }
      return pointAnchor;
    };

    PointToRangeConverter.prototype._snapPointToText = function(point) {
      return this._rightPointSnapper.snapPointToTextInElement(point, point.target) || this._belowPointSnapper.snapPointToTextInElement(point, point.target);
    };

    PointToRangeConverter.prototype._getStartAnchorOf = function(range) {
      return {
        container: range.startContainer,
        offset: range.startOffset
      };
    };

    PointToRangeConverter.prototype._getEndAnchorOf = function(range) {
      return {
        container: range.endContainer,
        offset: range.endOffset
      };
    };

    return PointToRangeConverter;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Range.LastSelection = (function() {
    function LastSelection() {}

    LastSelection.prototype.range = null;

    LastSelection.prototype.cloneRange = function() {
      return this.range.cloneRange();
    };

    LastSelection.prototype.exists = function() {
      return (this.range != null) && (this.range.getBoundingClientRect() != null) && this.range.getClientRects().length > 0;
    };

    LastSelection.prototype.rangeEqualsTo = function(range) {
      return (this.range != null) && this._hasSameStartAs(range) && this._hasSameEndAs(range);
    };

    LastSelection.prototype._hasSameStartAs = function(range) {
      return this.range.compareBoundaryPoints(Range.START_TO_START, range) === 0;
    };

    LastSelection.prototype._hasSameEndAs = function(range) {
      return this.range.compareBoundaryPoints(Range.END_TO_END, range) === 0;
    };

    return LastSelection;

  })();

}).call(this);

(function() {
  var RangeBoundary,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RangeBoundary = (function() {
    RangeBoundary.prototype._container = null;

    RangeBoundary.prototype._offset = null;

    function RangeBoundary(anchor) {
      this._container = anchor.container;
      this._offset = anchor.offset;
    }

    return RangeBoundary;

  })();

  CustomSelection.Lib.Range.StartBoundary = (function(_super) {
    __extends(StartBoundary, _super);

    function StartBoundary() {
      return StartBoundary.__super__.constructor.apply(this, arguments);
    }

    StartBoundary.prototype.applyTo = function(range) {
      return range.setStart(this._container, this._offset);
    };

    StartBoundary.prototype.applyOppositeTo = function(range) {
      return range.setEnd(this._container, this._offset);
    };

    return StartBoundary;

  })(RangeBoundary);

  CustomSelection.Lib.Range.EndBoundary = (function(_super) {
    __extends(EndBoundary, _super);

    function EndBoundary() {
      return EndBoundary.__super__.constructor.apply(this, arguments);
    }

    EndBoundary.prototype.applyTo = function(range) {
      return range.setEnd(this._container, this._offset);
    };

    EndBoundary.prototype.applyOppositeTo = function(range) {
      return range.setStart(this._container, this._offset);
    };

    return EndBoundary;

  })(RangeBoundary);

}).call(this);

(function() {
  CustomSelection.Lib.Range.SelectionBoundFactory = (function() {
    SelectionBoundFactory.prototype._lastSelection = null;

    SelectionBoundFactory.prototype._movingMarker = null;

    function SelectionBoundFactory(_lastSelection, _movingMarker) {
      this._lastSelection = _lastSelection;
      this._movingMarker = _movingMarker;
    }

    SelectionBoundFactory.prototype.getProtectedSelectionBound = function() {
      if (this._movingMarker.isStartMarker()) {
        return this._createEndBoundary({
          container: this._lastSelection.range.endContainer,
          offset: this._lastSelection.range.endOffset
        });
      } else {
        return this._createStartBoundary({
          container: this._lastSelection.range.startContainer,
          offset: this._lastSelection.range.startOffset
        });
      }
    };

    SelectionBoundFactory.prototype.getMovingSelectionBound = function(anchor) {
      if (this._movingMarker.isEndMarker()) {
        return this._createEndBoundary(anchor);
      } else {
        return this._createStartBoundary(anchor);
      }
    };

    SelectionBoundFactory.prototype._createEndBoundary = function(anchor) {
      return new CustomSelection.Lib.Range.EndBoundary(anchor);
    };

    SelectionBoundFactory.prototype._createStartBoundary = function(anchor) {
      return new CustomSelection.Lib.Range.StartBoundary(anchor);
    };

    return SelectionBoundFactory;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Range.SelectionConstructor = (function() {
    SelectionConstructor.prototype._settings = null;

    SelectionConstructor.prototype._selectionRangeBuilder = null;

    SelectionConstructor.prototype._markersWrapper = null;

    SelectionConstructor.prototype._pointFactory = null;

    SelectionConstructor.prototype._wordRangeBuilder = null;

    SelectionConstructor.prototype._frameRequester = null;

    SelectionConstructor.prototype._lastPoint = null;

    function SelectionConstructor(_settings, _selectionRangeBuilder, _markersWrapper, _pointFactory, _wordRangeBuilder, _frameRequester) {
      this._settings = _settings;
      this._selectionRangeBuilder = _selectionRangeBuilder;
      this._markersWrapper = _markersWrapper;
      this._pointFactory = _pointFactory;
      this._wordRangeBuilder = _wordRangeBuilder;
      this._frameRequester = _frameRequester;
    }

    SelectionConstructor.prototype.getWordSelectionFrom = function(hammerEvent) {
      var eventTarget, point, range;
      range = null;
      eventTarget = hammerEvent.pointers[0].target;
      if (!this._markersWrapper.isMarkerElement(eventTarget)) {
        point = this._pointFactory.createFromContentEvent(hammerEvent);
        range = this._wordRangeBuilder.getRangeOfWordUnderPoint(point);
      }
      return range;
    };

    SelectionConstructor.prototype.getSelectionUpdatedWith = function(jqueryEvent, onRangeReady) {
      this._lastPoint = this._pointFactory.createFromMarkerEvent(jqueryEvent.originalEvent, -this._settings.markerShiftY);
      return this._frameRequester.requestFrame((function(_this) {
        return function() {
          var range;
          range = _this._selectionRangeBuilder.getRangeUpdatedWithPoint(_this._lastPoint);
          return onRangeReady(range);
        };
      })(this));
    };

    return SelectionConstructor;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Range.SelectionRangeBuilder = (function() {
    SelectionRangeBuilder.prototype._contentContext = null;

    SelectionRangeBuilder.prototype._pointToRangeConverter = null;

    SelectionRangeBuilder.prototype._selectionBoundFactory = null;

    SelectionRangeBuilder.prototype._movingMarker = null;

    function SelectionRangeBuilder(_contentContext, _pointToRangeConverter, _selectionBoundFactory, _movingMarker) {
      this._contentContext = _contentContext;
      this._pointToRangeConverter = _pointToRangeConverter;
      this._selectionBoundFactory = _selectionBoundFactory;
      this._movingMarker = _movingMarker;
    }

    SelectionRangeBuilder.prototype.getRangeUpdatedWithPoint = function(point) {
      var anchor, coveringRange, movingBound, protectedBound;
      coveringRange = null;
      if (anchor = this._pointToRangeConverter.pointToRangeAnchor(point)) {
        coveringRange = this._contentContext.createRange();
        movingBound = this._selectionBoundFactory.getMovingSelectionBound(anchor);
        protectedBound = this._selectionBoundFactory.getProtectedSelectionBound();
        movingBound.applyTo(coveringRange);
        protectedBound.applyTo(coveringRange);
        if (coveringRange.collapsed) {
          protectedBound.applyOppositeTo(coveringRange);
          movingBound.applyOppositeTo(coveringRange);
          this._movingMarker.toggleMoving();
        }
      }
      return coveringRange;
    };

    return SelectionRangeBuilder;

  })();

}).call(this);

(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  CustomSelection.Lib.Range.WordRangeBuilder = (function() {
    var WHITESPACE_LIST;

    WHITESPACE_LIST = [' ', '\t', '\r', '\n'];

    WordRangeBuilder.prototype._nodeUtil = null;

    WordRangeBuilder.prototype._pointToRangeConverter = null;

    function WordRangeBuilder(_nodeUtil, _pointToRangeConverter) {
      this._nodeUtil = _nodeUtil;
      this._pointToRangeConverter = _pointToRangeConverter;
    }

    WordRangeBuilder.prototype.getRangeOfWordUnderPoint = function(point) {
      var range;
      range = null;
      if (point.isInText) {
        range = this._pointToRangeConverter.pointToRange(point);
        this._expandRangeToStartAfterTheWhitespaceOnLeft(range);
        this._expandRangeToEndBeforeTheWhitespaceOnRight(range);
      }
      return range;
    };

    WordRangeBuilder.prototype._expandRangeToStartAfterTheWhitespaceOnLeft = function(range) {
      while (!this._rangeStartsWithWhitespace(range)) {
        if (range.startOffset > 0) {
          range.setStart(range.startContainer, range.startOffset - 1);
        } else {
          if (!this._putRangeStartAtTheEndOfPreviousTextNode(range)) {
            return;
          }
        }
      }
      range.setStart(range.startContainer, range.startOffset + 1);
      if (this._rangeStartsOnWhitespaceAtTheEndOfNode(range)) {
        return range.setStart(this._nodeUtil.getTextNodeAfter(range.startContainer), 0);
      }
    };

    WordRangeBuilder.prototype._expandRangeToEndBeforeTheWhitespaceOnRight = function(range) {
      var maxIndex;
      while (!this._rangeEndsWithWhitespace(range)) {
        maxIndex = range.endContainer.data.length;
        if (range.endOffset < maxIndex) {
          range.setEnd(range.endContainer, range.endOffset + 1);
        } else {
          if (!this._putRangeEndAtTheBeginningOfNextTextNode(range)) {
            return;
          }
        }
      }
      return range.setEnd(range.endContainer, Math.max(range.endOffset - 1, 0));
    };

    WordRangeBuilder.prototype._rangeStartsWithWhitespace = function(range) {
      var firstLetter;
      firstLetter = range.toString()[0];
      return __indexOf.call(WHITESPACE_LIST, firstLetter) >= 0;
    };

    WordRangeBuilder.prototype._rangeEndsWithWhitespace = function(range) {
      var lastLetter, stringified;
      stringified = range.toString();
      lastLetter = stringified[stringified.length - 1];
      return __indexOf.call(WHITESPACE_LIST, lastLetter) >= 0;
    };

    WordRangeBuilder.prototype._putRangeStartAtTheEndOfPreviousTextNode = function(range) {
      var newStartContainer;
      if (newStartContainer = this._nodeUtil.getTextNodeBefore(range.startContainer)) {
        range.setStart(newStartContainer, newStartContainer.data.length);
        return true;
      } else {
        return false;
      }
    };

    WordRangeBuilder.prototype._putRangeEndAtTheBeginningOfNextTextNode = function(range) {
      var newEndContainer;
      if (newEndContainer = this._nodeUtil.getTextNodeAfter(range.endContainer)) {
        range.setEnd(newEndContainer, 0);
        return true;
      } else {
        return false;
      }
    };

    WordRangeBuilder.prototype._rangeStartsOnWhitespaceAtTheEndOfNode = function(range) {
      return this._nodeEndsWithWhitespace(range.startContainer) && (range.startOffset === range.startContainer.data.length || range.startOffset === range.startContainer.data.length - 1);
    };

    WordRangeBuilder.prototype._nodeEndsWithWhitespace = function(node) {
      var lastLetter;
      lastLetter = node.data[node.data.length - 1];
      return __indexOf.call(WHITESPACE_LIST, lastLetter) >= 0;
    };

    return WordRangeBuilder;

  })();

}).call(this);

(function() {
  CustomSelection.Lib.Utils.NodeUtil = (function() {
    function NodeUtil() {}

    NodeUtil.prototype.nodeIsText = function(node) {
      return node.nodeType === Node.TEXT_NODE && node.length > 0;
    };

    NodeUtil.prototype.getRectsForNode = function(node) {
      var range;
      range = node.ownerDocument.createRange();
      range.selectNode(node);
      return range.getClientRects();
    };

    NodeUtil.prototype.nodeHasRects = function(node) {
      return this.getRectsForNode(node).length > 0;
    };

    NodeUtil.prototype.nodeHasChildren = function(node) {
      return node.childNodes.length > 0;
    };

    NodeUtil.prototype.getTextNodeAfter = function(node) {
      var uncle;
      while (true) {
        if (this.nodeHasChildren(node)) {
          node = node.childNodes[0];
        } else if (node.nextSibling) {
          node = node.nextSibling;
        } else if (uncle = this._getSiblingAfterParentOf(node)) {
          node = uncle;
        } else {
          return null;
        }
        if (this.nodeIsText(node)) {
          break;
        }
      }
      return node;
    };

    NodeUtil.prototype.getTextNodeBefore = function(node) {
      var uncle;
      while (true) {
        if (this.nodeHasChildren(node)) {
          node = node.childNodes[node.childNodes.length - 1];
        } else if (node.previousSibling) {
          node = node.previousSibling;
        } else if (uncle = this._getSiblingBeforeParentOf(node)) {
          node = uncle;
        } else {
          return null;
        }
        if (this.nodeIsText(node)) {
          break;
        }
      }
      return node;
    };

    NodeUtil.prototype._getSiblingAfterParentOf = function(node) {
      var body;
      body = node.ownerDocument.body;
      while (!node.nextSibling) {
        if (node === body) {
          return null;
        }
        node = node.parentNode;
      }
      return node.nextSibling;
    };

    NodeUtil.prototype._getSiblingBeforeParentOf = function(node) {
      var body;
      body = node.ownerDocument.body;
      while (!node.previousSibling) {
        if (node === body) {
          return null;
        }
        node = node.parentNode;
      }
      return node.previousSibling;
    };

    return NodeUtil;

  })();

}).call(this);

(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
			window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
					callback(currTime + timeToCall);
				},
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}());
