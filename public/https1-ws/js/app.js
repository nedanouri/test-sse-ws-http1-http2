$(function () {
	"use strict";
  
	var commodities;
	var ws;
	
	function getCommodities() {
		var d = $.Deferred();
		
		$.ajax({
			url: "/all",
			dataType: "json"
		}).done(function (data) {
			commodities = data;
			
			var html = "";

			$(data).each(function(i, c) {
				html += `<tr data-code='${c.Code}'><td>${c.Symbol}</td><td>${Number(c.Bid.toFixed(4))}</td><td>${Number(c.Ask.toFixed(4))}</td><td>${c.Spread}</td></tr>`;
			});

			$("table.forex tbody").html(html);
			
			d.resolve(data);
		}).fail(function (xhr, status, text) {
			d.reject(status, text);
		});
		
		return d.promise();
	}
	
	function goLive() {
		window.WebSocket = window.WebSocket || window.MozWebSocket;
		
		ws = new WebSocket('wss://127.0.0.1:1337');
		
		ws.onopen = function () {
		  console.log('Websocket connection established.');
		}
		
		ws.onmessage = function (e) {
			try {
				var c = JSON.parse(e.data);
				var commodity = commodities.find(function (cm) { return cm.Code == c.code; });
				
				if (commodity) {
					var value = commodity[c.bid_or_ask ? 'Bid' : 'Ask'] + c.change;
					
					console.log(`code: ${c.code}, symbol: ${commodity.Symbol}, type: ${c.bid_or_ask ? 'bid':'ask'}, change: ${c.change}, old: ${commodity[c.bid_or_ask ? 'Bid' : 'Ask']}, new: ${value}`);
					
					commodity[c.bid_or_ask ? 'Bid' : 'Ask'] = value;
					
					var cell = $(`table.forex tbody tr[data-code='${c.code}'] td:nth-child(${c.bid_or_ask ? 2:3})`);
					
					cell.html(`<span>${value.toFixed(4)}</span><span class="${c.change > 0 ? 'up':'down'}">${c.change > 0 ? '&#9650;':'&#9660;'}</span>`).addClass(`changed-${c.change > 0 ? 'up':'down'}`);
					
					setTimeout(function() {
						cell.removeClass("changed-up").removeClass("changed-down");
					}, 1000 );
				}

			} catch (ex) {
				console.log(`message error: ${ex.message}`);
			}
		}
		ws.onerror = function (err) {
		  console.log(`WebSocket error: ${err}`);
		}
	}
	function stopForex() {
		if (ws.readyState === WebSocket.OPEN) {
			ws.close();
		}
	}
	function startForex() {
		var d = $.Deferred();
		
		getCommodities().done(function () {
			goLive();
			
			d.resolve();
		}).fail(function (status, text) {
			console.log(status, text);
			
			d.reject();
		});
		
		return d.promise();
	}
	
	$("#btn-toggle-forex").click(function () {
		var btn = $(this);
		
		btn.prop("disabled", true);
		
		if (btn.val() == 'start') {
			startForex().always(function () {
				btn.prop("disabled", false);
			});
		} else {
			stopForex();
			btn.prop("disabled", false);
		}
		
		btn.val(btn.val() == 'start' ? 'stop' : 'start');
	});
	
	$("#btn-toggle-forex").click();
});