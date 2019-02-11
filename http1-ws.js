const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const url = require('url');
const serverRoot = "./public/http1-ws";
const extend = require('util')._extend;
const WebSocket = require('ws');

var server;
var timer;
var commodities = [
	{ "Code": "SG"	, "Symbol": "Spot Gold			", "Bid": 1237.73	, "Ask": 1238.02	, "Spread": 0.30  },
	{ "Code": "SS"	, "Symbol": "Spot Silver		", "Bid": 14.562	, "Ask": 14.578		, "Spread": 2.00  },
	{ "Code": "OUSC", "Symbol": "Oil - US Crude		", "Bid": 51.554	, "Ask": 51.582		, "Spread": 2.80  },
	{ "Code": "OBC"	, "Symbol": "Oil - Brent Crude	", "Bid": 60.363	, "Ask": 60.401		, "Spread": 2.90  },
	{ "Code": "C"	, "Symbol": "Copper				", "Bid": 2.75365	, "Ask": 2.75565	, "Spread": 20.00 },
	{ "Code": "NG"	, "Symbol": "Natural Gas		", "Bid": 3.642		, "Ask": 3.646		, "Spread": 3.00  }
];
var history = [];

function sendFile(filepath, res) {
	const fullPath = path.join(serverRoot, filepath);
	const responseMimeType = mime.lookup(fullPath);
	
	function reportError(err) {
		console.log(err);
		res.writeHead(500);
		res.end('Internal Server Error');
	}
	
	fs.exists(fullPath, function(exists) {
		if (exists) {
			fs.stat(fullPath, function(err, stat) {
				var rs;
				if (err) {
					return reportError(err);
				}
				if (stat.isDirectory()) {
					res.writeHead(403); res.end('Forbidden');
				} else {
					rs = fs.createReadStream(fullPath);
					rs.on('error', reportError);
					res.writeHead(200, { 'Content-Type': responseMimeType });
					rs.pipe(res);
				}
			});
		} else {
			res.writeHead(404);
			res.end('Not found');
		}
	});
}

server = http.createServer((req, res) => {
	req.pathname = url.parse(req.url).pathname.toLowerCase();
	
	if (req.pathname == "/all") {
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify(commodities));
	} else if (req.pathname == "/") {
		sendFile("/index.html", res);
	} else {
		sendFile(req.pathname, res);
	}
});

function createRandomForex() {
	var index = Math.floor((Math.random() * commodities.length));
	var c = commodities[index];
	var tolerance = 1;
	var bid_or_ask = Math.random() > 0.5;
	var pos_or_neg = Math.random() > 0.5;
	var change = (pos_or_neg ? 1: -1) * parseFloat((Math.random() * tolerance).toFixed(3));
	
	c[bid_or_ask ? "Bid" : "Ask"] += change;
	
	history.push({ code: c.Code, bid_or_ask: bid_or_ask, change: change});
	
	var t = Math.floor(3 + Math.random() * 2);
	
	timer = setTimeout(createRandomForex, t * 1000);
}

timer = setTimeout(createRandomForex, 3000);

const wss = new WebSocket.Server({ server: server, clientTracking: true });

wss.on('connection', ws => {
	console.log("client connected");
	
	var lastHistoryLength = history.length;
	var interval;
	
	function sendForexChanges() {
	  if (history.length > lastHistoryLength) {
		for (var i = lastHistoryLength; i < history.length; i++) {
			var data = history[i];
			
			ws.send(JSON.stringify(data));
		}
		
		lastHistoryLength = history.length;
	  }
	  
	  interval = setTimeout(sendForexChanges, 100);
	}
	
	interval = setTimeout(sendForexChanges, 100);

	ws.on('close', () => {
		clearTimeout(interval);
		
		console.log("client disconnected");
	});
});

console.log("Testing WebSocket over http/1.1 without SSL");
console.log("server running at port 1334");
server.listen(1334);