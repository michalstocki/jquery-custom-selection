# jQuery Custom Selection #

### Overrides native text selection on touch devices ###
Using native text selection causes displaying CAB bar (Android) or actions buttons (iOS) which are often undesired in HTML5-based mobile applications. We created jQuery Custom Selection to avoid native text selection appearance, especially in following environments of HTML5 applications:

- Flex (StageWebView)
- Apache Cordova / PhoneGap
- mobile website

## Warning: Unstable ##
Custom Selection is still unstable and should not be used in production.

## Usage ##

1. Include dependencies:
    - jQuery

        `<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>`
    - [Hammer.js](http://hammerjs.github.io/)

        `<script src="bower_components/hammerjs/hammer.min.js"></script>`

2. Include plugin's code:

        <script src="dist/jquery.custom-selection.min.js"></script>

3. Call the plugin:

        $('body').customSelection();

## Advanced API ##

### Initialization

		var iframe = $('iframe')[0];
		$(iframe.contentDocument.body).customSelection({
			startMarker: $('.selection-marker-start'),
			endMarker: $('.selection-marker-end'),
			onSelectionChange: function(range) {},
			contextOrigin: {
				scale: 0.7,
				offsetX: 100,
				offsetY: 35
			}
		});

### Refreshing

		$(iframe.contentDocument.body).refreshCustomSelection({
			scale: 0.8,
			offsetX: 80,
			offsetY: 25
		)};

## Acknowledgements ##

Great thanks for [Young Digital Planet](http://www.ydp.eu/) for supporting creation of this plugin.

