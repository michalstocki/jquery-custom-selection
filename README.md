# jQuery Custom Selection #

### Override native text selection on touch devices ###
Using native text selection causes displaying CAB bar (Android) or actions buttons (iOS) which are often undesired in HTML5-based mobile applications. We created jQuery Custom Selection to avoid native text selection appearance, especially in following environments of HTML5 applications:

- Flex (WebStageView)
- Apache Cordova / PhoneGap
- mobile website

## Usage ##

1. Include jQuery:

        <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>

2. Include plugin's code:

        <script src="dist/jquery.custom-selection.min.js"></script>

3. Call the plugin:

        $("body").customSelection({
    	    markerClass: "marker"
        });