var gui = require('nw.gui');
var guiState = 'hidden';
var win = gui.Window.get();
var tray = new gui.Tray({ title: 'ShowStream', icon: 'appicon.png' });
var menu = new gui.Menu();
var stopMenuItem = new gui.MenuItem({
	label: "Exit application",
	click: function() {
		process.exit(0);
	}
});
var checkForUpdates = new gui.MenuItem({
	label: "Check for updates",
	click: function() {
		var iframe = document.createElement('iframe');
		iframe.src = 'updates.html';
		iframe.width = '100%';
		iframe.height = '100%';
		iframe.scrolling = 'no';
		iframe.allowfullscreen = 'true';
		iframe.allowtransparency = 'true';
		iframe.style.position = 'absolute';
		iframe.style.top = '0px';
		iframe.style.left = '0px';
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = 'none';
		iframe.onload = function() {
			win.show();
		};
		document.body.appendChild(iframe);
	}
});
menu.append(checkForUpdates);
menu.append(stopMenuItem);
tray.menu = menu;
tray.tooltip = 'ShowStream';
win.hide();