$(document).on('keydown', function(e) {
	var gui = require('nw.gui');
	var win = gui.Window.get();
	if(e.keyCode == 123) {
		win.showDevTools();
	} else if(e.keyCode == 116) {
		win.reloadDev();
	}
})