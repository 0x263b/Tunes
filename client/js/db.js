var defaultPort = 5775;

var DB = function(server, port){
	this.server = server;
	this.port = port || defaultPort;
	this.ws = new connection('ws://'+server+':'+this.port);
	
	this.status = false;
	
	var self = this;
	
	this.ws.on('status', function(status){
		self.status = status;
		self.emit('status', status);
	});
	
	this.ws.run('music', 'sync', function(data){
		for (var i in data.songs) {
			self.songs[i] = data.songs[i];
		}
		for (var i in data.artists) {
			self.artists[i] = data.artists[i];
		}
		for (var i in data.albums) {
			self.albums[i] = data.albums[i];
		}
	});
	
	this.songs = {};
	this.artists = {};
	this.albums = {};
	
	this.cache = {
		findSongsByArtist: {},
		findArtists: false,
		findAlbumsByArtist: {}
	};
};

DB.prototype = EventEmitter.prototype;

DB.prototype.getSong = function(id){
	if (!this.songs[id]) return false;
	var song = this.songs[id];
	var data = $.extend({}, song);
	data.artist = this.artists[ song.artist ][0];
	data.album = this.albums[ song.album ];
	
	return data;
};

DB.prototype.url = function(id){
	return 'http://'+this.server+':'+this.port+'/song/'+id+'.mp3';
};

DB.connections = {};
DB.get = function(server, port){
	port = port || defaultPort;
	if (!DB.connections[server+':'+port]) {
		DB.connections[server+':'+port] = new DB(server, port);
	}
	return DB.connections[server+':'+port];
};
DB.current = function(newCurrent){
	if (DB._current == newCurrent) {
		return false;
	}
	if (newCurrent) {
		DB._current = newCurrent;
	} else {
		if (!DB._current) {
			throw new Error('We ain\'t connected to shit');
		}
		return DB.get(DB._current);
	}
};

DB.getSongs = function(list, callback){
	var fetch = {};
	for (var i in list) {
		var dbName;
		var song = list[i];
		if (typeof song == 'string' || typeof song == 'number') {
			dbName = DB._current;
		} else {
			dbName = song[0];
			song = song[1];
		}
		if (typeof fetch[ dbName ] == 'undefined') {
			fetch[ dbName ] = {};
		}
		fetch[ dbName ][song] = true;
	}
	for (var dbName in fetch) {
		var currentDB = DB.get(dbName);
		var fetchedSongs = 0;
		for (var songID in fetch[dbName]) {
			if (typeof currentDB.songs[songID] != 'undefined') {
				delete fetch[dbName][songID];
			} else {
				fetchedSongs++;
			}
		}
		if (!fetchedSongs) {
			delete fetch[dbName];
		}
	}
	
	var totalDBs = Object.keys(fetch).length;
	var doneDBs = 0;
	
	if (totalDBs == 0) {
		var out = [];
		for (var i in list) {
			var currentDB;
			var song;
			if (typeof list[i] == 'string' || typeof list[i] == 'number') {
				currentDB = DB.current();
				song = list[i];
			} else {
				currentDB = DB.get(list[i][0]);
				song = list[i][1];
			}
			out.push( currentDB.getSong(song) );
		}
		callback && callback(out);
		return;
	}
	
	for (var dbName in fetch) {
		DB.get(dbName).findSongs( Object.keys(fetch[dbName]), function(){
			doneDBs++;
			if (doneDBs == totalDBs) {
				DB.getSongs(list, callback);
			}
		});
	}
};

var songList = function(mydb, list){
	this.db = mydb;
	this.list = list;
};
songList.prototype.each = function(item, finish, pointer){
	pointer = pointer || 0;
	
	var self = this;
	
	if (pointer < this.list.length) {
		item && item(this.db.getSong( this.list[pointer] ), function(){
			self.each(item, finish, pointer+1);
		});
	} else {
		//we're done!
		finish && finish();
	}
};
songList.prototype.toArray = function(){
	var out = [];
	for (var i in this.list) {
		out.push( this.db.getSong(this.list[i]) );
	}
	return out;
};
songList.prototype.ids = function(){
	return this.list;
};

DB.prototype.songList = function(list){
	return new songList(this, list);
};

DB.prototype.findSongsByArtist = function(artist, callback){
	if (this.cache['findSongsByArtist'][artist]) {
		callback && callback(this.cache['findSongsByArtist'][artist]);
		return;
	}
	var self = this;
	this.ws.run('music', 'findSongsByArtist', artist, function(list){
		self.cache['findSongsByArtist'][artist] = list;
		callback && callback( list );
	});
};

DB.prototype.findArtists = function(callback){
	if (this.cache['findArtists']) {
		var out = [];
		for (var i in this.cache['findArtists']) {
			out.push(this.artists[ this.cache['findArtists'][i] ]);
		}
		callback && callback(out);
		return;
	}
	var self = this;
	this.ws.run('music', 'findArtists', function(artistList){
		self.cache['findArtists'] = artistList;
		self.findArtists(callback);
	});
};

DB.prototype.findAlbumsByArtist = function(artist, callback){
	if (this.cache['findAlbumsByArtist'][artist]) {
		callback && callback(this.cache['findAlbumsByArtist'][artist]);
		return;
	}
	var self = this;
	this.ws.run('music', 'findAlbumsByArtist', artist, function(albumIDs){
		var albumNames = {};
		for (var i in albumIDs) {
			albumNames[albumIDs[i]] = self.albums[albumIDs[i]];
		}
		self.cache['findAlbumsByArtist'][artist] = albumNames;
		callback && callback(albumNames);
	});
};

DB.prototype.findSong = function(songID, callback){
	this.findSongs([songID], function(songs){
		callback && callback(songs[0]);
	});
};

DB.prototype.findSongs = function(songIDs, callback){
	var fetch = [];
	for (var i in songIDs) {
		if (!this.songs[songIDs[i]]) {
			fetch.push(songIDs[i]);
		}
	}
	var self = this;
	if (fetch.length) {
		this.ws.run('music', 'findSongs', fetch, function(){
			self.findSongs(songIDs, callback);
		});
	} else {
		var out = [];
		for (var i in songIDs) {
			out.push( this.getSong(songIDs[i]) );
		}
		callback && callback(out);
	}
};
