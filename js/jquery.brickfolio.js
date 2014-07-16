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
			itemSelector: '> .brickfolio-item', // the jQuery selector to find items within the container. Assuming default values this would be ".brickfolio > .brickfolio-item"
			imageSelector: '> img:first', // the jQuery selector to find the main image within an item. Assuming default values this would be ".brickfolio-item > img"
			gutter: 40, // number in pixels of the gutter between items. This is used as a minimum value for vertical gutters and an absolute value for horizontal ones.
			responseTime: 100, // number in milliseconds before the layout is redrawn after the window resizes
			hideErrors: false, // automatically hides any items where the image has failed to load
			loadTime: 0, // only used to delay loading for testing purposes.
			classes: {
				loaded: 'brickfolio-loaded', // class added to the container once items are loaded
				error: 'brickfolio-item-error' // class added to items that have broken images
			}
		};

		_.$el = $(element);
		_.options = $.extend(true, _.defaults, options);

		__.timer = null;

		/**
		 * Initializes the plugin applying required CSS, binding events and performing an initial layout.
		 * @returns {Brickfolio}
		 */
		__.init = function(){
			if (_.$el.css('position') == 'static') _.$el.css('position', 'relative');
			_.$el.css('overflow', 'hidden');
			var $items = _.$el.find(_.options.itemSelector).css({
				position: 'absolute',
				display: 'inline-block',
				margin: 0
			});
			if ($items.length > 0){
				_.wait($items).always(function(){
					$(window).off('resize.brickfolio').on('resize.brickfolio', function(){
						if (__.timer != null) clearTimeout(__.timer);
						__.timer = setTimeout(function(){
							__.timer = null;
							_.layout($items);
						}, _.options.responseTime);
					});
					_.layout($items);
					_.$el.addClass(_.options.classes.loaded);
				});
			}
			return _;
		};

		_.reinit = function(options){
			_.options = $.extend(true, _.options, options);
			var $items = _.$el.find(_.options.itemSelector).css({
				position: 'absolute',
				display: 'inline-block',
				margin: 0
			});
			if ($items.length > 0){
				_.wait($items).always(function(){
					$(window).off('resize.brickfolio').on('resize.brickfolio', function(){
						if (__.timer != null) clearTimeout(__.timer);
						__.timer = setTimeout(function(){
							__.timer = null;
							_.layout($items);
						}, _.options.responseTime);
					});
					_.layout($items);
					_.$el.addClass(_.options.classes.loaded);
				});
			}
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
				if ($img.length > 0){
					deferreds.push($.Deferred(function(defer){
						setTimeout(function(){
							var img = $img.get(0);
							if (img.complete == true){
								if ('naturalHeight' in img && 'naturalWidth' in img && img.naturalHeight == 0 && img.naturalWidth == 0){
									if (_.options.hideErrors) $item.hide();
									$item.addClass(_.options.classes.error);
									defer.reject($img);
								} else {
									defer.resolve($img);
								}
							} else {
								$img.on({
									'load.brickfolio': function(){
										$img.off('.brickfolio');
										defer.resolve($img);
									},
									'error.brickfolio': function(){
										$img.off('.brickfolio');
										if (_.options.hideErrors) $item.hide();
										$item.addClass(_.options.classes.error);
										defer.reject($img);
									}
								});
							}
						}, _.options.loadTime);
					}).promise());
				}
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
				padding = parseInt(_.$el.css('padding')),
				tallest = { height: 0, outer: 0 },
				row_items = [],
				v_gutter = _.options.gutter,
				top = padding,
				cols = Math.floor(container_width / item_width);

			cols = Math.floor((container_width - ((cols - 1) * _.options.gutter)) / item_width);

			if (_.options.hideErrors) $items = $items.not('.'+_.options.classes.error);
			$items.each(function(i){
				var $item = $(this), heights = _.getHeights($item);
				if (i % cols == 0){
					if (row_items.length > 0){
						v_gutter = _.update(row_items, tallest.height, item_width, container_width, cols, v_gutter, top, padding);
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
			_.update(row_items, tallest.height, item_width, container_width, cols, v_gutter, top, padding);
			top += tallest.outer - _.options.gutter;
			_.$el.height(top);
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