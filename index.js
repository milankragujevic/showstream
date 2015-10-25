var express = require('express');
var fs = require('fs');
var path = require('path');
var http = require('http');
var os = require('os');
var md5 = require('md5');
var api = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var request = require('sync-request');
var peerflix = require('peerflix');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var parseTorrent = require('parse-torrent');

var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json')));
var torrents = {};
var tmpDir = path.join(os.tmpdir(), 'playforever');

var runTorrent = function(url, req, res) {
	var id = md5(url);
	console.log('runTorrent started for %s', id);
	console.log('Starting peerflix...');
	torrents[id] = {
		atime: Math.floor(Date.now() / 1000),
		peerflix: peerflix(url, {
			path: tmpDir,
			port: config.peerflix_port,
			buffer: (5 * 1024 * 1024).toString(),
			connections: 100,
			upload: 2
		}),
		stream: ''
	};
	torrents[id].peerflix.on('ready', function() {
		console.log('Peerflix ready. ');
		var stream = 'http://127.0.0.1:' + config.peerflix_port + '/0';
		console.log('Torrent available at %s', stream);
		torrents[id].stream = stream;
		res.send({
			status: 'ok',
			id: id,
			stream: stream
		});
	});
};

api.use(bodyParser.json());
api.use(morgan('dev'));
api.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});
api.get('/', function(req, res) {
	res.send({
		status: 'ok',
		version: config.version,
		torrents: Object.keys(torrents)
	});
});
api.get('/page', function(req, res) {
	var url = req.query.url;
	if(url == '' || !url || url == null || typeof url == 'undefined') {
		res.status(422).send({
			status: 'error', 
			error: "URL not set, can't request page." 
		});
		return; 
	}
	request.get(url).pipe(res);
});
api.get('/stream', function(req, res) {
	var url = req.query.url;
	if(url == '' || !url || url == null || typeof url == 'undefined') {
		res.status(422).send({
			status: 'error', 
			error: "URL not set, can't add torrent." 
		});
		return; 
	}
	var protocol = url.split(':')[0];
	if(protocol != 'http' && protocol != 'https' && protocol != 'magnet') {
		res.status(422).send({ 
			status: 'error', 
			error: "URL is not a valid path to a torrent file or a valid magnet link." 
		});
		return; 
	}
	console.log('Attemptin to stream %s', url);
	if(protocol == 'magent') {
		runTorrent(url, req, res);
	} else {
		console.log('Parsing remote torrent...');
		parseTorrent.remote(url, function(err, torrent) {
			runTorrent(parseTorrent.toMagnetURI(torrent), req, res);
		});
	}
});
api.get('/ping/:id', function(req, res) {
	var id = req.params.id;
	console.log("Received ping for %s", id);
	if(typeof torrents[id] == 'undefined') {
		res.status(422).send({
			status: 'error',
			error: "Provided ID is not valid or doesn't exist. "
		});
		return;
	}
	torrents[id].atime = Math.floor(Date.now() / 1000);
	res.send({
		status: 'ok'
	});
});

var server = http.createServer(api);
server.listen(config.webui_port);
server.on('listening', function() {
    console.log('Listening on %s:%s', server.address().address, server.address().port);
}); 