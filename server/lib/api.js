var express = require('express');
var http = require('http');
var wsio = require('websocket.io');
var library = require('./library');

var app = express();
var server = http.createServer(app);
var ws = wsio.attach(server);

app.get('/song/:id.:ext', function(req, res){
	var songs = library.songs.find('id', req.params.id);
	
	if (songs.length == 0) {
		res.send(404);
	} else {
		var ext = songs[0].file.split('.').pop();
		
		if (ext == req.params.ext) {
			res.sendFile(songs[0].file);
		} else {
			res.send(404);
		}
	}
});

var inputWalker = function(socket, data){
	for (var i in data) {
		var type = typeof data[i];
		if (type == 'object' && data[i] !== null) {
			if (data[i].__type == 'callback') {
				data[i] = (function(functionID){
					return function(){
						var packet = [functionID];
						for (var i in arguments) {
							packet.push(arguments[i]);
						}
						socket.send(JSON.stringify(packet));
					};
				})(data[i].id);
			} else {
				inputWalker(socket, data[i]);
			}
		}
	}
};

var api = {
	music: {
		findArtists: function(client, callback){
			var out = {};
			var artists = library.artists.data;
			
			for (var id in artists) {
				out[id]  = [artists[id].name, artists[id].art];
			}
			
			client.syncArtists(out);
			callback && callback(true);
		},
		findAlbumsByArtist: function(client, artist, callback){
			var albums = library.albums.find('artist', artist);
			
			var out = {};
			for (var i in albums) {
				out[albums[i]._id] = albums[i].name;
			}
			client.syncAlbums(out)
			callback && callback( Object.keys(out) );
		},
		findSongsByArtist: function(client, artist, callback){
			var songList = library.songs.find('artist', artist);
			
			if (!client.known.artists[artist]) {
				client.syncArtist(artist, library.artists.find('id', artist)[0].name);
			}
			
			for (var i in songList) {
				if (!client.known.albums[songList[i].album] && songList[i].album) {
					client.syncAlbum(songList[i].album, library.albums.find('id', songList[i].album)[0].name);
				}
			}
			callback( client.syncSongs(songList) );
		},
		findSongs: function(client, songIDs, callback){
			var out = [];
			for (var i in songIDs) {
				console.log('find id', songIDs[i]);
				var song = library.songs.find('id', songIDs[i]);
				if (!song.length) continue;
				
				song = song[0];
				
				out.push(song);
				
				if (!client.known.artists[song.artist]) {
					client.syncArtist(song.artist, library.artists.find('id', song.artist)[0].name);
				}
				
				if (!client.known.albums[song.album]) {
					client.syncAlbum(song.album, library.albums.find('id', song.album)[0].name);
				}
			}
			
			client.syncSongs(out);
			callback(true);
		},
		sync: function(client, callback){
			client.syncCallback = (client.allowsCallbacks && callback) ? callback : function(){client.reply.apply(client,arguments)};
		}
	}
};

var WSClient = function(socket){
	this.socket = socket;
	
	this.syncCallback = function(){};
	this.known = {
		songs: {},
		artists: {},
		albums: {}
	};
	this.syncQueue = {
		songs: {},
		artists: {},
		albums: {}
	};
};
WSClient.prototype.allowsCallbacks = true;
WSClient.prototype.reply = function(){
	return false;
};
WSClient.prototype.flush = function(){
	for (var i in this.syncQueue) {
		if (Object.keys(this.syncQueue[i]).length == 0) {
			delete this.syncQueue[i];
		}
	}
	if (Object.keys(this.syncQueue).length > 0) {
		this.syncCallback && this.syncCallback(this.syncQueue);
	}
	this.syncQueue.songs = {};
	this.syncQueue.artists = {};
	this.syncQueue.albums = {};
};
WSClient.prototype.syncSongs = function(list){
	var out = [];
	for (var i in list) {
		out.push( this.syncSong( list[i] ) );
	}
	this.flush();
	return out;
};
WSClient.prototype.syncArtists = function(list){
	var out = [];
	for (var i in list) {
		out.push( this.syncArtist( i, list[i] ) );
	}
	this.flush();
	return out;
};
WSClient.prototype.syncAlbums = function(list){
	var out = [];
	for (var i in list) {
		out.push( this.syncAlbum( i, list[i] ) );
	}
	this.flush();
	return out;
};
WSClient.prototype.syncSong = function(song){
	if (this.known.songs[ song._id ]) {
		//it is known
	} else {
		var songCopy = {};
		for (var i in song) {
			if (i != 'albumartist' && i != 'file') {
				songCopy[i] = song[i];
			}
		}
		this.syncQueue.songs[ song._id ] = songCopy;
		this.known.songs[ song._id ] = true;
	}
	return song._id;
};
WSClient.prototype.syncArtist = function(id, name){
	if (this.known.artists[id]) {
		//it is known
	} else {
		this.known.artists[id] = true;
		this.syncQueue.artists[id] = name;
	}
	return id;
};
WSClient.prototype.syncAlbum = function(id, name){
	if (this.known.albums[id]) {
		//it is known
	} else {
		this.known.albums[id] = true;
		this.syncQueue.albums[id] = name;
	}
	return id;
};

ws.on('connection', function(socket){
	var client = new WSClient(socket);
	socket.on('message', function(msg){
		try {
			var args = JSON.parse(msg);
			inputWalker(socket, args);
		} catch (err) {
			console.log(err);
			socket.close();
			return;
		}
		
		if (!Array.isArray(args)) return;
		if (args.length < 2) return;
		
		var type = args.shift();
		var method = args.shift();
		
		if (typeof type != 'string' || typeof method != 'string') return;
		
		if (typeof api[type] == 'undefined') return;
		if (typeof api[type][method] == 'undefined') return;
		
		args.unshift(client);
		
		api[type][method].apply(api[type], args);
	});
});

module.exports.app = app;
module.exports.ws = ws;
module.exports.api = api;
module.exports.server = server;
