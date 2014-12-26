# brickfolio

Better Grid Layouts - Especially for Portfolio Pages!

## Install

Install using [Bower](http://bower.io): `bower install brickfolio`

Or copy the following files into your project:

+ [jquery.brickfolio.min.js](dist/js/jquery.brickfolio.min.js)
+ [brickfolio.min.css](dist/css/brickfolio.min.css)

## Usage

In your HTML:

```html
<div class="brickfolio">
	<div class="bf-item">
		<img data-src="image1.png">
		<h4>Lorem ipsum dolor sit</h4>
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eadem nunc mea adversum te oratio est.</p>
	</div>
	<div class="bf-item">
		<img data-src="image2.png">
		<h4>Quare attende, quaeso</h4>
		<p>Quare attende, quaeso. Sed plane dicit quod intellegit. Non semper, inquam;</p>
	</div>
</div>
```

In your Javascript:

```javascript
jQuery(function($){
  $('.brickfolio').brickfolio({
		animation: 'fly', // drop|fade-in|flip|fly|pop-up|scale-up|slide-up|swing-down
		filter: '.ignore-item', // a selector used to filter out items
		gutter: 40, // number in pixels of the gutter between items
		responseTime: 200, // number in milliseconds before the layout is redrawn after the window resizes
		hideErrors: false, // automatically hides items where the image fails to load
		classes: {
			container: 'brickfolio', // class added to the container
			loaded: 'bf-loaded', // class added to the container once items are loaded
			animated: 'bf-animated', // class added to the container to indicate animations are supported and being used
			item: 'bf-item', // class added to items within the container
			error: 'bf-error', // class added to items that have broken images
			filtered: 'bf-filtered' // class added to filtered items
		}
	});
});
```

In your CSS:

```css
.bf-item {
	/* The brickfolio item must have a width set. */
	width: 250px;
}
```

* * *

Copyright :copyright: 2014 FooPlugins
