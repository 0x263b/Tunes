var connection = (function(){
var cn = function(address){
	var ws = new WebSocket(address);
	
	var isConnected = false;
	var messageQueue = [];
	
	var send = function(msg){
		if (!isConnected) {
			messageQueue.push(msg);
		} else {
			//console.debug('Sending message:', msg);
			ws.send(msg);
		}
	};
	
	var self = this;
	
	ws.onopen = function(){
		console.log(address, 'is open');
		isConnected = true;
		self.status = 'open';
		self.emit('status', 'open');
		var msg;
		while (msg = messageQueue.shift()) {
			send(msg);
		}
	};
	
	ws.onmessage = function(msg){
		//console.debug(address, 'got message:', msg.data);
		msg = JSON.parse(msg.data);
		
		var functionID = msg[0] || 'unspecified';
		if (!callbacks[functionID]) {
			console.error(address, 'server called function '+functionID+' but it doesn\'t exist!');
		} else {
			callbacks[functionID].apply(this, msg.slice(1));
		}
	};
	
	ws.onclose = function(){
		console.log(address, 'is closed');
		isConnected = false;
		self.status = 'closed';
		self.emit('status', 'closed');
	};
	
	var callbacks = {};
	
	var alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	var randomString = function(len, existing){
		var str = '';
		for (var i = 0; i < len; i++) {
			str += alphanumeric[ Math.floor(Math.random() * alphanumeric.length) ];
		}
		if (existing && typeof existing[str] != 'undefined') {
			str = randomString(len, existing);
		}
		return str;
	};
	
	/*
		Given an array, walker will recursively replace all functions with
		json-safe callback references like {"__type": "callback", "id": "Df9T"}
		with the original function being stored at callbacks["Df9T"]
	*/
	var walker = function(data){
		for (var i in data) {
			var type = typeof data[i];
			if (type == 'object') {
				walker(data[i]);
			} else if (type == 'function') {
				var functionID = randomString(4, callbacks);
				callbacks[functionID] = data[i];
				data[i] = {__type: 'callback', id: functionID};
			}
		}
	};
	
	this.run = function(){
		if (this.status == 'closed') {
			self.emit('status', 'closed');
			return;
		}
		var args = Array.prototype.slice.call(arguments);
		walker(args);
		var msg = JSON.stringify(args);
		send(msg);
	};
};
cn.prototype = EventEmitter.prototype;
return cn;
})();
