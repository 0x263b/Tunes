var util = require('util');
var events = require('events');

var indexedObject = function(name){
	this.name = name;
	events.EventEmitter.call(this);
	this.data = {};
	this.indexes = {};
};

util.inherits(indexedObject, events.EventEmitter);

indexedObject.prototype.iterator = 0;
indexedObject.prototype.newId = function(){
	this.iterator++;
	return this.iterator;
};

indexedObject.prototype.backup = function(){
	return {
		data: this.data,
		indexes: this.indexes,
		iterator: this.iterator
	};
};

indexedObject.prototype.restore = function(stuff){
	this.data = stuff.data;
	this.indexes = stuff.indexes;
	this.iterator = stuff.iterator;
};

indexedObject.prototype.create = function(data){
	if (!data._id) {
		data._id = this.newId();
	}
	var id = data._id;
	this.data[id] = data;
	
	this.emit('create', id, data);
	
	for (var field in this.indexes) {
		if (!data[field]) continue;
		
		if (!this.indexes[field][data[field]]) {
			this.indexes[field][data[field]] = {};
		}
		
		if (this.indexes[field][data[field]][id] !== true) {
			this.indexes[field][data[field]][id] = true;
			this.emit('index', field, data[field], id, true);
		}
	}
	
	return id;
};

indexedObject.prototype.update = function(id, data){
	if (!data._id) {
		data._id = id;
	}
	
	var old = this.data[id];
	
	for (var i in data) {
		this.data[id][i] = data[i];
	}
	
	for (var field in this.indexes) {
		if (data[field] === old[field]) continue;
		
		if (typeof old[field] != 'undefined' && typeof this.indexes[field][old[field]][id] != 'undefined') {
			delete this.indexes[field][old[field]][id];
			this.emit('index', field, old[field], id, false);
		}
		
		if (typeof data[field] != 'undefined') {
			if (!this.indexes[field][data[field]]) {
				this.indexes[field][data[field]] = {};
			}
			
			if (this.indexes[field][data[field]][id] !== true) {
				this.indexes[field][data[field]][id] = true;
				this.emit('index', field, data[field], id, true);
			}
		}
	}
	
	this.emit('update', id, data);
	
	return id;
};

indexedObject.prototype.remove = function(id){
	var item = this.data[id];
	if (!item) return;
	
	for (var field in this.indexes) {
		if (typeof item[field] != 'undefined' && typeof this.indexes[field][item[field]][id] != 'undefined') {
			delete this.indexes[field][item[field]][id];
			this.emit('index', field, item[field], id, false);
		}
	}
	
	this.emit('preremove', id, this.data[id]);
	
	delete this.data[id];
	
	this.emit('remove', id);
};

indexedObject.prototype.save = function(data){
	if (!data._id || typeof this.data[data._id] == 'undefined') {
		return this.create(data);
	} else {
		return this.update(data._id, data);
	}
};

indexedObject.prototype.multiFindIDSet = function(requirements){
	var out = {};
	var firstRound = true;
	
	for (var field in requirements) {
		var value = requirements[field];
		var idSet = this.findIDSet(field, value);
		
		if (firstRound) {
			for (var id in idSet) {
				out[id] = true;
			}
			firstRound = false;
		} else {
			for (var id in out) {
				if (!idSet[id]) {
					delete out[id];
				}
			}
		}
	}
	return out;
};

indexedObject.prototype.findIDSet = function(field, value){
	if (field == 'id') {
		var out = [];
		out[value] = true;
		return out;
	}
	if (typeof this.indexes[field] == 'undefined') return {};
	return this.indexes[field][value] || {};
};

indexedObject.prototype.find = function(field, value){
	var idList;
	if (typeof field == 'object') {
		idList = Object.keys(this.multiFindIDSet(field));
	} else {
		idList = Object.keys(this.findIDSet(field, value));
	}
	for (var i in idList) {
		idList[i] = this.data[ idList[i] ];
	}
	return idList;
};

indexedObject.prototype.watch = function(field, value){
	var watcher = new events.EventEmitter();
	
	var self = this;
	process.nextTick(function(){
		if (field == 'id') {
			watcher.emit('all', [self.data[value]]);
			self.on('update', function(id, data){
				if (id == value) {
					watcher.emit('update', id, data);
				}
			});
		} else {
			var idList = Object.keys(self.indexes[field][value]) || [];
			var out = {};
			for (var i in idList) {
				out[idList[i]] = self.data[idList[i]];
			}
			watcher.emit('all', out);
			self.on('update', function(id, data){
				if (typeof self.indexes[field][value] != 'undefined') {
					watcher.emit('update', id, data);
				}
			});
			self.on('index', function(field2, value2, id, status){
				if (field == field2 && value == value2) {
					if (status) {
						watcher.emit('add', id, self.data[id]);
					} else {
						watcher.emit('remove', id);
					}
				}
			});
		}
	});
	
	return watcher;
};

indexedObject.prototype.index = function(field){
	if (!this.indexes[field]) {
		this.indexes[field] = {};
	}
};

module.exports = indexedObject;
