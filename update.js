var openURL = function(url) {
	return require('nw.gui').Shell.openExternal(url);
};
var hideWindow = function() {
	require('nw.gui').Window.get().hide();
};
var fs = require('fs');
var path = require('path');
var config = JSON.parse(fs.readFileSync(path.resolve('config.json')));
var version = config.version;
$.get('http://showstream.xyz/update', function(data) {
	$('.spinner').fadeOut(300);
	if(data.version == version) {
		$('.no-updates').fadeIn(300);
	} else {
		$('.update-available').fadeIn(300);
	}
}).fail(function() {
	$('.spinner').fadeOut(300);
	$('.server-error').fadeIn(300);
});