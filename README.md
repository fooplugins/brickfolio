# brickfolio

Better Grid Layouts - Especially for Portfolio Pages!

## Install

Install using [Bower](http://bower.io): `bower install brickfolio`

Or copy the following files into your project:

+ [jquery.brickfolio.min.js](dist/js/jquery.brickfolio.min.js)
+ [brickfolio.min.css](dist/css/brickfolio.min.css)

## Usage

In your HTML:

`<div class="brickfolio">
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
</div>`

In your Javascript:

`jQuery(function($){
  $('.brickfolio').brickfolio();
});`

In your CSS:

`.bf-item {
	/* The brickfolio item must have a width set. */
	width: 250px;
}`

* * *

Copyright :copyright: 2014 FooPlugins
