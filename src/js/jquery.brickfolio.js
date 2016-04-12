/*jslint devel: true, browser: true, unparam: true, debug: false, es5: true, white: false, maxerr: 1000 */
/**!
 * Brickfolio - A jQuery plugin for equally spaced grid layouts
 * @version 0.0.5
 * @link https://github.com/fooplugins/brickfolio
 * @copyright Steven Usher & Brad Vincent 2014
 * @license Released under the GPL license.
 * You are free to use Brickfolio in personal projects as long as this copyright header is left intact.
 */
(function($){

	/**
	 * Creates a new instance of the Brickfolio plugin.
	 * @param element
	 * @param options
	 * @returns {Brickfolio}
	 * @constructor
	 */
	function Brickfolio(element, options){
		if (!(this instanceof Brickfolio)) return new Brickfolio(element, options);

		var _ = this, __ = {};

		_.defaults = {
			animation: '', // adds the specified animation class to the container. Available = 'swing-forward'|'fly'|'fall'
			filter: '', // a selector used to filter out items
			itemSelector: '.bf-item', // the jQuery selector to find items within the container. Assuming default values this would be ".brickfolio .bf-item"
			imageSelector: 'img:first', // the jQuery selector to find the main image within an item. Assuming default values this would be ".bf-item img:first"
			gutter: 40, // number in pixels of the gutter between items. This is used as a minimum value for vertical gutters and an absolute value for horizontal ones.
			responseTime: 100, // number in milliseconds before the layout is redrawn after the window resizes
			hideErrors: false, // automatically hides any items where the image has failed to load
			loadTime: 0, // only used to delay loading for testing and demo purposes.
			classes: {
				container: 'brickfolio', // class added to the container
				loaded: 'bf-loaded', // class added to the container once items are loaded
				animated: 'bf-animated', // class added to the container to indicate animations are supported and being used
				item: 'bf-item', // class added to items within the container
				error: 'bf-error', // class added to items that have broken images
				filtered: 'bf-filtered' // class added to filtered items
			}
		};

		_.$el = $(element);
		_.options = $.extend(true, _.defaults, options);

		/**
		 * Reinitializes the plugin with the specified options. Unlike init which uses the default options as the base for merging, reinit uses the current options instead.
		 * @param {object} options - The plugin options to use.
		 */
		_.reinit = function(options){
			$(window).off('resize.brickfolio', __.onWindowResize);
			_.$el.removeClass([_.options.animation, _.options.classes.animated, _.options.classes.loaded].join(' ')).find(_.options.itemSelector)
				.removeClass([_.options.classes.loaded, _.options.classes.error, _.options.classes.filtered].join(' '))
				.css('visibility', 'hidden');

			_.options = $.extend(true, _.options, options);
			__.init();
		};

		/**
		 * Filters the current items using the specified selector.
		 * @param {string} selector - A jQuery selector that specifies the items to show.
		 */
		_.filter = function(selector){
			_.options.filter = selector;
			_.layout();
		};

		/**
		 * Simply tells brickfolio to perform a layout of it's current items.
		 */
		_.layout = function(){
			var $items = _.$el.find(_.options.itemSelector);
			$items = __.filter($items);
			__.layout($items);
			$items.css('visibility', '');
		};

		/* The below are all private methods and properties not intended for public use. */

		__.loader = null;
		__.layout_timer = null;
		__.resize_timer = null;
		__.isIE = null;

		/**
		 * Initializes the plugin applying required CSS, binding events and performing an initial layout.
		 * @returns {Brickfolio}
		 */
		__.init = function(){
			if (_.$el.css('position') == 'static') _.$el.css('position', 'relative');
			_.$el.addClass(_.options.classes.container).css('overflow', 'hidden');

			var test = _.options.animation.replace(/\s*mixed-delay\s*/g, ' ').replace(/^\s+|\s+$/g, "");
			if (__.supportsAnimation() && typeof test === 'string' && test.length > 0){
				_.$el.addClass(_.options.classes.animated).addClass(_.options.animation);
			}

			var $items = _.$el.find(_.options.itemSelector).addClass(_.options.classes.item).css({
				position: 'absolute',
				display: 'inline-block',
				margin: 0,
				visibility: 'hidden'
			});

			if ($items.length > 0){
				__.wait($items).always(function(){
					$items = __.filter($items);
					__.layout($items);
					$items.css('visibility', '');
					$(window).on('resize.brickfolio', __.onWindowResize);
					_.$el.addClass(_.options.classes.loaded);
				});
			}
			return _;
		};

		/**
		 * Handles the window resize event throttling it as specified by the responseTime option.
		 */
		__.onWindowResize = function(){
			if (__.resize_timer != null) clearTimeout(__.resize_timer);
			__.resize_timer = setTimeout(function(){
				__.resize_timer = null;
				_.layout();
			}, _.options.responseTime);
		};

		/**
		 * This function is only here because of IE not supporting late binding to the image error event.
		 * To work around this you have to reset the src after binding, initially this may look expensive but if the image is already loaded IE will simply fetch it from the cache.
		 * @param {*} $img - The jQuery image object.
		 */
		__.damnYouIE = function($img){
			if (__.isIE == null) __.isIE = window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
			if (__.isIE == true){
				$img.attr("src", $img.attr("src"));
			}
		};

		/**
		 * Checks whether the browser supports the CSS animation property.
		 * @returns {boolean}
		 */
		__.supportsAnimation = function(){
			var b = document.body || document.documentElement;
			var s = b.style, p = 'animation', v;
			if(typeof s[p] == 'string') { return true; }

			// Tests for vendor specific prop
			v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
			p = p.charAt(0).toUpperCase() + p.substr(1);
			for(var i=0; i<v.length; i++) {
				if(typeof s[v[i] + p] == 'string') { return true; }
			}
			return false;
		};

		/**
		 * Filters the supplied items.
		 * @param {*} $items - The jQuery object of items to filter.
		 * @returns {*}
		 */
		__.filter = function($items){
			$items.removeClass(_.options.classes.filtered).css({visibility: '', opacity: '', animation: '', '-webkit-animation': ''});
			if (_.options.hideErrors) $items.filter('.'+_.options.classes.error).addClass(_.options.classes.filtered).css({visibility: 'hidden', opacity: 0, animation: 'none', '-webkit-animation': 'none'});
			if (typeof _.options.filter === 'string' && _.options.filter.length > 0){
				$items.not(_.options.filter).addClass(_.options.classes.filtered).css({visibility: 'hidden', opacity: 0, animation: 'none', '-webkit-animation': 'none'});
			}
			return $items.not('.'+_.options.classes.filtered);
		};

		/**
		 * Waits for the supplied items images to complete loading before continuing.
		 * @param {*} $items - The jQuery object of items to wait on.
		 * @returns {jQuery.Deferred}
		 */
		__.wait = function($items){
			var deferreds = [];
			$items.each(function(){
				var $item = $(this),
					$img = $item.find(_.options.imageSelector),
					deferred = new $.Deferred(function(d){
						setTimeout(function(){
							if ($img.length == 0){
								d.resolve();
							} else if ($img.get(0).complete == true){
								var img = $img.get(0);
								if ('naturalHeight' in img && 'naturalWidth' in img && img.naturalHeight == 0 && img.naturalWidth == 0){
									$item.addClass(_.options.classes.error);
								} else {
									$item.addClass(_.options.classes.loaded);
								}
								d.resolve();
							} else {
								$img.on({
									'load.brickfolio': function(){
										$img.off('.brickfolio');
										$item.addClass(_.options.classes.loaded);
										d.resolve();
									},
									'error.brickfolio': function(){
										$img.off('.brickfolio');
										$item.addClass(_.options.classes.error);
										d.resolve();
									}
								});
								__.damnYouIE($img);
							}
						}, _.options.loadTime);
					});
				deferreds.push(deferred);
			});
			return $.when.apply($, deferreds);
		};

		/**
		 * Performs the actual layout on the supplied items.
		 * @param {*} $items - The jQuery object of items to layout.
		 */
		__.layout = function($items){
			var item_width = $items.first(':not(.'+_.options.classes.error+')').outerWidth(),
				container_width = _.$el.width(),
				paddingLeft = parseInt(_.$el.css('paddingLeft')),
				paddingTop = parseInt(_.$el.css('paddingTop')),
				tallest = { height: 0, outer: 0 },
				row_items = [],
				v_gutter = _.options.gutter,
				top = paddingTop,
				cols = Math.floor(container_width / item_width);

			cols = Math.floor((container_width - ((cols - 1) * _.options.gutter)) / item_width);
			cols = cols <= 0 ? 1 : cols;
			if (_.options.hideErrors) $items = $items.not('.'+_.options.classes.error);

			$items.each(function(i){
				var $item = $(this);
				$item.css('height', '');
				var heights = { height: $item.height(), outer: $item.outerHeight() };
				if (i % cols == 0){
					if (row_items.length > 0){
						v_gutter = __.update(row_items, tallest.height, item_width, container_width, cols, v_gutter, top, paddingLeft);
						top += tallest.outer + _.options.gutter;
					}
					row_items.length = 0;
					tallest = heights;
					row_items.push($item);
				} else {
					tallest = heights.height > tallest.height ? heights : tallest;
					row_items.push($item);
				}
			});
			__.update(row_items, tallest.height, item_width, container_width, cols, v_gutter, top, paddingLeft);
			top += tallest.outer - paddingTop;
			_.$el.height(top);

			// recheck size after a small delay to make sure scrollbars etc. didn't pop up due to the previous layout
			if (__.layout_timer) clearTimeout(__.layout_timer);
			__.layout_timer = setTimeout(function(){
				__.layout_timer = null;
				if (container_width != _.$el.width()){
					__.layout($items);
				}
			}, 600);
		};

		/**
		 * Updates a row of items layout.
		 * @param {Array} row_items - The array of items for the row.
		 * @param {number} tallest - The tallest items height in this row.
		 * @param {number} item_width - The width of each item.
		 * @param {number} container_width - The width of the container the items are in.
		 * @param {number} expected_count - The expected number of items for a row. (Essentially the number of columns it should be displaying.)
		 * @param {number} v_gutter - The previous rows vertical gutter calculation. This is used for rows that have less items than expected.
		 * @param {number} top - The current row items top position.
		 * @param {number} left - The current row items starting left position.
		 * @returns {number} - This rows current vertical gutter.
		 */
		__.update = function(row_items, tallest, item_width, container_width, expected_count, v_gutter, top, left){
			if (row_items.length == 0) return v_gutter;
			var short = row_items.length < expected_count || row_items.length <= 2,
				remainder = container_width - (row_items.length * item_width);

			if (row_items.length == 1){ // 1 column
				row_items[0].height(tallest);
				left += remainder / 2;
				row_items[0].css({ top: top, left: left });
			} else {
				v_gutter = short ? v_gutter : Math.floor(remainder / (row_items.length - 1));
				left += short ? Math.floor((remainder - ((row_items.length - 1) * v_gutter)) / 2) : 0;
				for (var i = 0; i < row_items.length; i++){
					row_items[i].height(tallest);
					row_items[i].css({ top: top, left: left + (item_width * i) + (v_gutter * i)});
				}
			}
			return v_gutter;
		};

		return __.init();
	}

	/**
	 * Performs a simple layout routine on the selected containers items.
	 * @param {(object|string)} [optionsOrMethod] - The plugin options or the method to execute.
	 * @param {*} [arg1] - If the first parameter is a method call this is the first argument passed to the method.
	 * @param {*} [argN] - Any additional arguments to pass to the method.
	 * @returns {*}
	 */
	$.fn.brickfolio = function(optionsOrMethod, arg1, argN){
		if (typeof optionsOrMethod === 'string'){ // perform a method call
			var args = Array.prototype.slice.call(arguments),
				methodName = args.shift(),
				method = function(brickfolio){ return $.isFunction(brickfolio[methodName]) ? brickfolio[methodName] : $.noop; };

			return this.each(function(){
				if (this.__brickfolio__ instanceof Brickfolio){
					method(this.__brickfolio__).apply(this.__brickfolio__, args);
				}
			});
		} else {
			return this.each(function(){
				if (this.__brickfolio__ instanceof Brickfolio){
					this.__brickfolio__.reinit(optionsOrMethod);
				} else {
					this.__brickfolio__ = new Brickfolio(this, optionsOrMethod);
				}
			});
		}
	};

})(jQuery);