# jQuery Custom Selection #

### Overrides native text selection on touch devices ###
Using native text selection causes displaying CAB bar (Android) or actions buttons (iOS) which are often undesired in HTML5-based mobile applications. We created jQuery Custom Selection to avoid native text selection appearance, especially in following environments of HTML5 applications:

- Flex (StageWebView)
- Apache Cordova / PhoneGap
- mobile website

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

Example advanced initialization via jQuery plugin:

	var iframeBody = $('iframe')[0].contentDocument.body;
	var options = {
		startMarker: $('.selection-marker-start'),
		endMarker: $('.selection-marker-end'),
		onSelectionChange: function(range) {},
		contentOrigin: {
			scale: 0.7,
			offsetX: 100,
			offsetY: 35
		}
	};
	$(iframeBody).customSelection(options);
		
The same effect we can accomplish using classic object-oriented API:
	
	var customSelection = new CustomSelection(iframeBody, options);

### Refreshing

Refreshes the selection drawing and the markers position. Useful after a screen resize or change of the iframe scale.

	var contentOrigin = {
        scale: 0.8,
        offsetX: 80,
        offsetY: 25
    };
	$(iframeBody).refreshCustomSelection(contentOrigin);
	
or 
	
	customSelection.refresh(contentOrigin);
	
### Clearing

Clears current selection and calls `onSelectionChange` callback with an empty range.

	$(iframeBody).clearCustomSelection();
	
or

	customSelection.clear();
	
### Disabling

Disables Custom Selection and restores a native text selection. It is possible to re-enable Custom Selection using a next initialization.

	$(iframeBody).disableCustomSelection();
	
or

	customSelection.destroy();

## Acknowledgements ##

Great thanks for [Young Digital Planet](http://www.ydp.eu/) for supporting creation of this plugin.

