/*
 jQuery Simple Slider

 Copyright (c) 2012 James Smith (http://loopj.com)

 Licensed under the MIT license (http://mit-license.org/)
*/

(function($) {
	// Used by dateinput
	$.expr = {':': {}};

	// Used by bootstrap
	$.support = {};

	// Used by dateinput
	$.fn.clone = function(){
			var ret = $();
			this.each(function(){
					ret.push(this.cloneNode(true))
			});
			return ret;
	};

	["Left", "Top"].forEach(function(name, i) {
		var method = "scroll" + name;

		function isWindow( obj ) {
				return obj && typeof obj === "object" && "setInterval" in obj;
		}

		function getWindow( elem ) {
			return isWindow( elem ) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;
		}

		$.fn[ method ] = function( val ) {
			var elem, win;

			if ( val === undefined ) {

				elem = this[ 0 ];

				if ( !elem ) {
					return null;
				}

				win = getWindow( elem );

				// Return the scroll offset
				return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
						win.document.documentElement[ method ] ||
						win.document.body[ method ] :
						elem[ method ];
			}

			// Set the scroll offset
			this.each(function() {
				win = getWindow( this );

				if ( win ) {
					var xCoord = !i ? val : $( win ).scrollLeft();
					var yCoord = i ? val : $( win ).scrollTop();
					win.scrollTo(xCoord, yCoord);
				} else {
					this[ method ] = val;
				}
			});
		}
	});

	// Used by colorslider.js
	['width', 'height'].forEach(function(dimension) {
		var offset, Dimension = dimension.replace(/./, function(m) { return m[0].toUpperCase() });
		$.fn['outer' + Dimension] = function(margin) {
			var elem = this;
			if (elem) {
				var size = elem[dimension]();
				var sides = {'width': ['left', 'right'], 'height': ['top', 'bottom']};
				sides[dimension].forEach(function(side) {
					if (margin) size += parseInt(elem.css('margin-' + side), 10);
				});
				return size;
			} else {
				return null;
			}
		};
	});

	// Used by bootstrap
	$.proxy = function( fn, context ) {
		if ( typeof context === "string" ) {
			var tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !$.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		var args = Array.prototype.slice.call( arguments, 2 ),
			proxy = function() {
				return fn.apply( context, args.concat( Array.prototype.slice.call( arguments ) ) );
			};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || proxy.guid || $.guid++;

		return proxy;
	};

	// Used by timeago
	var nativeTrim = String.prototype.trim;
	$.trim = function(str, characters){
		if (!characters && nativeTrim) {
			return nativeTrim.call(str);
		}
		characters = defaultToWhiteSpace(characters);
		return str.replace(new RegExp('\^[' + characters + ']+|[' + characters + ']+$', 'g'), '');
	};

	// Used by util.js
	var rtable = /^t(?:able|d|h)$/i,
	rroot = /^(?:body|html)$/i;
	$.fn.position = function() {
		if ( !this[0] ) {
			return null;
		}

		var elem = this[0],

		// Get *real* offsetParent
		offsetParent = this.offsetParent(),
		// Get correct offsets
		offset			 = this.offset(),
		parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

		// Subtract element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		offset.top	-= parseFloat( $(elem).css("margin-top") ) || 0;
		offset.left -= parseFloat( $(elem).css("margin-left") ) || 0;

		// Add offsetParent borders
		parentOffset.top	+= parseFloat( $(offsetParent[0]).css("border-top-width") ) || 0;
		parentOffset.left += parseFloat( $(offsetParent[0]).css("border-left-width") ) || 0;

		// Subtract the two offsets
		return {
			top:	offset.top	- parentOffset.top,
			left: offset.left - parentOffset.left
		};
	};

	$.fn.offsetParent = function() {
		var ret = $();
		this.each(function(){
			var offsetParent = this.offsetParent || document.body;
			while ( offsetParent && (!rroot.test(offsetParent.nodeName) && $(offsetParent).css("position") === "static") ) {
				offsetParent = offsetParent.offsetParent;
			}
			ret.push(offsetParent);
		});
		return ret;
	};
	
	// For dateinput
	Event.prototype.isDefaultPrevented = function() {
		return this.defaultPrevented;
	};
})(Zepto);

var __slice = [].slice,
	__indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function($, window) {
	var SimpleSlider;
	SimpleSlider = (function() {

		function SimpleSlider(input, options) {
			var ratio,
				_this = this;
			this.input = input;
			this.defaultOptions = {
				animate: true,
				snapMid: false,
				classPrefix: null,
				classSuffix: null,
				theme: null
			};
			this.settings = $.extend({}, this.defaultOptions, options);
			if (this.settings.theme) {
				this.settings.classSuffix = "-" + this.settings.theme;
			}
			this.input.hide();
			this.slider = $("<div>").addClass("slider" + (this.settings.classSuffix || "")).css({
				userSelect: "none"
			}).insertBefore(this.input);
			if (this.input.attr("id")) {
				this.slider.attr("id", this.input.attr("id") + "-slider");
			}
			this.track = $("<div>").addClass("track").css({
				userSelect: "none",
				cursor: "pointer"
			}).appendTo(this.slider);
			this.slider.mousedown(function(e) {
				if (e.which !== 1) {
					return;
				}
				_this.domDrag(e.pageX, e.pageY);
				_this.dragging = true;
				return false;
			});
			$(window).mousemove(function(e) {
				if (_this.dragging) {
					_this.domDrag(e.pageX, e.pageY);
					return $("body").css({
						cursor: "pointer"
					});
				}
			}).mouseup(function(e) {
				if (_this.dragging) {
					_this.domDrag(e.pageX, e.pageY, true);
					_this.dragging = false;
					return $("body").css({
						cursor: "auto"
					});
				}
			});
			this.pagePos = 0;
			if (this.input.val() === "") {
				this.value = this.getRange().min;
				this.input.val(this.value);
			} else {
				this.value = this.nearestValidValue(this.input.val());
			}
			this.setSliderPositionFromValue(this.value);
			ratio = this.valueToRatio(this.value);
			this.input.trigger("slider:ready", {
				value: this.value,
				ratio: ratio,
				position: ratio * this.slider.outerWidth(),
				el: this.slider
			});
		}

		SimpleSlider.prototype.setRatio = function(ratio) {
			if (this.dragging) return;
			var value;
			ratio = Math.min(1, ratio);
			ratio = Math.max(0, ratio);
			value = this.ratioToValue(ratio);
			this.setSliderPositionFromValue(value);
			return this.valueChanged(value, ratio, "setRatio");
		};

		SimpleSlider.prototype.setValue = function(value) {
			var ratio;
			value = this.nearestValidValue(value);
			ratio = this.valueToRatio(value);
			this.setSliderPositionFromValue(value);
			return this.valueChanged(value, ratio, "setValue");
		};

		SimpleSlider.prototype.domDrag = function(pageX, pageY, finished) {
			var pagePos, ratio, value;
			pagePos = pageX - this.slider.offset().left;
			pagePos = Math.min(this.slider.outerWidth(), pagePos);
			pagePos = Math.max(0, pagePos);
			if (this.pagePos !== pagePos || finished) {
				this.pagePos = pagePos;
				ratio = pagePos / this.slider.outerWidth();
				value = this.ratioToValue(ratio);
				this.valueChanged(value, ratio, finished ? "domDragged" : "domDrag");
				if (this.settings.snap) {
					return this.setSliderPositionFromValue(value);
				} else {
					return this.setSliderPosition(pagePos);
				}
			}
		};

		SimpleSlider.prototype.setSliderPosition = function(position, animate) {
			if (animate == null) {
				animate = false;
			}
			position = (position/this.slider.width()*100)+'%';
			if (animate && this.settings.animate) {
				this.track.animate({
					width: position
				}, 200);
			} else {
				this.track.css({
					width: position
				});
			}
		};

		SimpleSlider.prototype.setSliderPositionFromValue = function(value, animate) {
			var ratio;
			if (animate == null) {
				animate = false;
			}
			ratio = this.valueToRatio(value);
			return this.setSliderPosition(ratio * this.slider.outerWidth(), animate);
		};

		SimpleSlider.prototype.getRange = function() {
			if (this.settings.allowedValues) {
				return {
					min: Math.min.apply(Math, this.settings.allowedValues),
					max: Math.max.apply(Math, this.settings.allowedValues)
				};
			} else if (this.settings.range) {
				return {
					min: parseFloat(this.settings.range[0]),
					max: parseFloat(this.settings.range[1])
				};
			} else {
				return {
					min: 0,
					max: 1
				};
			}
		};

		SimpleSlider.prototype.nearestValidValue = function(rawValue) {
			var closest, maxSteps, range, steps;
			range = this.getRange();
			rawValue = Math.min(range.max, rawValue);
			rawValue = Math.max(range.min, rawValue);
			if (this.settings.allowedValues) {
				closest = null;
				$.each(this.settings.allowedValues, function() {
					if (closest === null || Math.abs(this - rawValue) < Math.abs(closest - rawValue)) {
						return closest = this;
					}
				});
				return closest;
			} else if (this.settings.step) {
				maxSteps = (range.max - range.min) / this.settings.step;
				steps = Math.floor((rawValue - range.min) / this.settings.step);
				if ((rawValue - range.min) % this.settings.step > this.settings.step / 2 && steps < maxSteps) {
					steps += 1;
				}
				return steps * this.settings.step + range.min;
			} else {
				return rawValue;
			}
		};

		SimpleSlider.prototype.valueToRatio = function(value) {
			var allowedVal, closest, closestIdx, idx, range, _i, _len, _ref;
			if (this.settings.equalSteps) {
				_ref = this.settings.allowedValues;
				for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
					allowedVal = _ref[idx];
					if (!(typeof closest !== "undefined" && closest !== null) || Math.abs(allowedVal - value) < Math.abs(closest - value)) {
						closest = allowedVal;
						closestIdx = idx;
					}
				}
				if (this.settings.snapMid) {
					return (closestIdx + 0.5) / this.settings.allowedValues.length;
				} else {
					return closestIdx / (this.settings.allowedValues.length - 1);
				}
			} else {
				range = this.getRange();
				return (value - range.min) / (range.max - range.min);
			}
		};

		SimpleSlider.prototype.ratioToValue = function(ratio) {
			var idx, range, rawValue, step, steps;
			if (this.settings.equalSteps) {
				steps = this.settings.allowedValues.length;
				step = Math.round(ratio * steps - 0.5);
				idx = Math.min(step, this.settings.allowedValues.length - 1);
				return this.settings.allowedValues[idx];
			} else {
				range = this.getRange();
				rawValue = ratio * (range.max - range.min) + range.min;
				return this.nearestValidValue(rawValue);
			}
		};

		SimpleSlider.prototype.valueChanged = function(value, ratio, trigger) {
			var eventData;
			if (value.toString() === this.value.toString() && trigger != 'domDragged') {
				return;
			}
			this.value = value;
			eventData = {
				value: value,
				ratio: ratio,
				position: ratio * this.slider.outerWidth(),
				trigger: trigger,
				el: this.slider
			};
			return this.input.val(value).trigger($.Event("change", eventData)).trigger("slider:changed", eventData);
		};

		return SimpleSlider;

	})();
	$.extend($.fn, {
		simpleSlider: function() {
			var params, publicMethods, settingsOrMethod;
			settingsOrMethod = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
			publicMethods = ["setRatio", "setValue"];
			return $(this).each(function() {
				var obj, settings;
				if (settingsOrMethod && __indexOf.call(publicMethods, settingsOrMethod) >= 0) {
					obj = $(this).data("slider-object");
					return obj[settingsOrMethod].apply(obj, params);
				} else {
					settings = settingsOrMethod;
					return $(this).data("slider-object", new SimpleSlider($(this), settings));
				}
			});
		}
	});
	return $(function() {
		return $("[data-slider]").each(function() {
			var $el, allowedValues, settings, x;
			$el = $(this);
			settings = {};
			allowedValues = $el.data("slider-values");
			if (allowedValues) {
				settings.allowedValues = (function() {
					var _i, _len, _ref, _results;
					_ref = allowedValues.split(",");
					_results = [];
					for (_i = 0, _len = _ref.length; _i < _len; _i++) {
						x = _ref[_i];
						_results.push(parseFloat(x));
					}
					return _results;
				})();
			}
			if ($el.data("slider-range")) {
				settings.range = $el.data("slider-range").split(",");
			}
			if ($el.data("slider-step")) {
				settings.step = $el.data("slider-step");
			}
			settings.snap = $el.data("slider-snap");
			settings.equalSteps = $el.data("slider-equal-steps");
			if ($el.data("slider-theme")) {
				settings.theme = $el.data("slider-theme");
			}
			return $el.simpleSlider(settings);
		});
	});
})(this.jQuery || this.Zepto, this);
