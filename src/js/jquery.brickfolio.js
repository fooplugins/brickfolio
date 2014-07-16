(function($){

	/**
	 *
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
			itemSelector: '> .bf-item', // the jQuery selector to find items within the container. Assuming default values this would be ".brickfolio > .brickfolio-item"
			imageSelector: '> img:first', // the jQuery selector to find the main image within an item. Assuming default values this would be ".brickfolio-item > img"
			gutter: 40, // number in pixels of the gutter between items. This is used as a minimum value for vertical gutters and an absolute value for horizontal ones.
			responseTime: 100, // number in milliseconds before the layout is redrawn after the window resizes
			hideErrors: false, // automatically hides any items where the image has failed to load
			loadTime: 0, // only used to delay loading for testing and demo purposes.
			classes: {
				container: 'brickfolio', // class added to the container
				loaded: 'bf-loaded', // class added to the container once items are loaded
				item: 'bf-item', // class added to items within the container
				error: 'bf-error' // class added to items that have broken images
			}
		};

		_.$el = $(element);
		_.options = $.extend(true, _.defaults, options);

		__.layout = null;
		__.timer = null;
		__.isIE = null;

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
		 * Initializes the plugin applying required CSS, binding events and performing an initial layout.
		 * @returns {Brickfolio}
		 */
		__.init = function(){
			if (_.$el.css('position') == 'static') _.$el.css('position', 'relative');
			_.$el.addClass(_.options.classes.container).css('overflow', 'hidden');
			if (__.supportsAnimation()) _.$el.addClass(_.options.animation);

			var $items = _.$el.find(_.options.itemSelector).addClass(_.options.classes.item).css({
				position: 'absolute',
				display: 'inline-block',
				margin: 0,
				visibility: 'hidden'
			});

			if ($items.length > 0){
				_.wait($items).always(function(){
					$(window).on('resize.brickfolio', function(){
						if (__.timer != null) clearTimeout(__.timer);
						__.timer = setTimeout(function(){
							__.timer = null;
							_.layout($items);
						}, _.options.responseTime);
					});
					_.layout($items);
					$items.css('visibility', 'visible');
					_.$el.addClass(_.options.classes.loaded);
				});
			}
			return _;
		};

		/**
		 * Reinitializes the plugin with the specified options. Unlike init which uses the default options as the base for merging, reinit uses the current options instead.
		 * @param {object} options - The plugin options to use.
		 */
		_.reinit = function(options){
			$(window).off('resize.brickfolio');
			_.$el.removeClass([_.options.animation, _.options.classes.loaded].join(' '))
				.find(_.options.itemSelector)
				.removeClass([_.options.classes.loaded, _.options.classes.error].join(' '));
			_.options = $.extend(true, _.options, options);
			__.init();
		};

		/**
		 * Waits for the supplied items images to complete loading before continuing.
		 * @param {*} $items - The jQuery object of items to wait on.
		 * @returns {jQuery.Deferred}
		 */
		_.wait = function($items){
			var deferreds = [];
			$items.each(function(){
				var $item = $(this), $img = $item.find(_.options.imageSelector);
				deferreds.push(new $.Deferred(function(deferred){
					setTimeout(function(){
						if ($img.length == 0){
							deferred.resolve();
						} else if ($img.get(0).complete == true){
							var img = $img.get(0);
							if ('naturalHeight' in img && 'naturalWidth' in img && img.naturalHeight == 0 && img.naturalWidth == 0){
								if (_.options.hideErrors) $item.hide();
								$item.addClass(_.options.classes.error);
								deferred.reject();
							} else {
								$item.addClass(_.options.classes.loaded);
								deferred.resolve();
							}
						} else {
							$img.on({
								'load.brickfolio': function(){
									$img.off('.brickfolio');
									$item.addClass(_.options.classes.loaded);
									deferred.resolve();
								},
								'error.brickfolio': function(){
									$img.off('.brickfolio');
									if (_.options.hideErrors) $item.hide();
									$item.addClass(_.options.classes.error);
									deferred.reject();
								}
							});
							__.damnYouIE($img);
						}
					}, _.options.loadTime);
				}));
			});
			return $.when.apply($, deferreds);
		};

		/**
		 * Performs the actual layout on the supplied items.
		 * @param {*} $items - The jQuery object of items to layout.
		 */
		_.layout = function($items){
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

			if (_.options.hideErrors) $items = $items.not('.'+_.options.classes.error);
			$items.each(function(i){
				var $item = $(this), heights = _.getHeights($item);
				if (i % cols == 0){
					if (row_items.length > 0){
						v_gutter = _.update(row_items, tallest.height, item_width, container_width, cols, v_gutter, top, paddingLeft);
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
			_.update(row_items, tallest.height, item_width, container_width, cols, v_gutter, top, paddingLeft);
			top += tallest.outer - paddingTop;
			_.$el.height(top);

			// recheck size after a second to make sure scrollbars etc. didn't pop up due to the previous layout
			if (__.layout) clearTimeout(__.layout);
			__.layout = setTimeout(function(){
				if (container_width != _.$el.width()){
					_.layout($items);
				}
			}, 1000);
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
		_.update = function(row_items, tallest, item_width, container_width, expected_count, v_gutter, top, left){
			if (row_items.length == 0) return v_gutter;
			var short = row_items.length < expected_count || row_items.length <= 2,
				remainder = container_width - (row_items.length * item_width);

			if (row_items.length == 1){ // 1 column
				_.setHeights(row_items[0], tallest);
				left += remainder / 2;
				row_items[0].css({ top: top, left: left });
			} else {
				v_gutter = short ? v_gutter : Math.floor(remainder / (row_items.length - 1));
				left += short ? Math.floor((remainder - ((row_items.length - 1) * v_gutter)) / 2) : 0;
				for (var i = 0; i < row_items.length; i++){
					_.setHeights(row_items[i], tallest);
					row_items[i].css({ top: top, left: left + (item_width * i) + (v_gutter * i)});
				}
			}
			return v_gutter;
		};

		/**
		 * Sets the height of an item storing the original height and outer height in a data variable.
		 * @param {*} $item - The jQuery item object.
		 * @param {number} height - The height to set the item to.
		 */
		_.setHeights = function($item, height){
			if ($item.data('brickfolio_height') == undefined)
				$item.data('brickfolio_height', { height: $item.height(), outer: $item.outerHeight() });

			$item.height(height);
		};

		/**
		 * Gets the original height and outer height of the item.
		 * @param {*} $item - The jQuery item object.
		 * @returns {{height: *, outer: *}}
		 */
		_.getHeights = function($item){
			return $item.data('brickfolio_height') == undefined
				? { height: $item.height(), outer: $item.outerHeight() }
				: $item.data('brickfolio_height');
		};

		return __.init();
	}

	/**
	 * Performs a simple layout routine on the selected containers items.
	 * @param {object} [options] - The plugin options.
	 * @returns {*}
	 */
	$.fn.brickfolio = function(options){
		return this.each(function(){
			if (this.__brickfolio__){
				this.__brickfolio__.reinit(options);
			} else {
				this.__brickfolio__ = new Brickfolio(this, options);
			}
		});
	};

})(jQuery);