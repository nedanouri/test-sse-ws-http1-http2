const http = require('https');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const url = require('url');
const serverRoot = "./public/http1-sse";
const extend = require('util')._extend;

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

const options = {
    key: fs.readFileSync('./selfsigned.key'),
    cert: fs.readFileSync('./selfsigned.crt')
}
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

server = http.createServer(options, (req, res) => {
	req.pathname = url.parse(req.url).pathname.toLowerCase();
	
	if (req.pathname == "/all") {
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify(commodities));
	} else if (req.pathname == "/live") {
		res.writeHead(200, {
		  'Content-Type': 'text/event-stream',
		  'Cache-Control': 'no-cache',
		  'Connection': 'keep-alive'
		});
		
		var lastHistoryLength = history.length;
		var interval;
		
		function sendForexChanges() {
		  if (!res.finished && history.length > lastHistoryLength) {
			for (var i = lastHistoryLength; i < history.length; i++) {
				var data = history[i];
				
				res.write(`data: ${JSON.stringify(data)}\n\n`);
			}
			
			// console.log(`${req.headers['user-agent']}\nlastHistoryLength: old = ${lastHistoryLength}, new = ${history.length}`);
			
			lastHistoryLength = history.length;
		  }
		  
		  interval = setTimeout(sendForexChanges, 100);
		}
		
		interval = setTimeout(sendForexChanges, 100);
		
		req.on('close', () => {
			clearTimeout(interval);
			
			console.log("client disconnected");
		});
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

console.log("Testing SSE over http/1.1 + SSL");
console.log("server running at port 1333");
server.listen(1333);