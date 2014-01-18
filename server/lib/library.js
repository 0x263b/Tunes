var fs = require('fs');

var indexedObject = require('./db');

var songs = new indexedObject('songs');

songs.index('artist');
songs.index('album');

var artists = new indexedObject('artists');
artists.index('name');

var albums = new indexedObject('albums');
albums.index('name');
albums.index('artist');

var addArtistID = function(name){
	var artist = artists.find('name', name)[0];
	if (typeof artist == 'undefined') {
		artistID = artists.save({
			name: name
		});
	} else {
		artistID = artist._id;
	}
	return artistID;
};

var addAlbumID = function(name, artist){
	var album = albums.find('name', name)[0];
	if (typeof album == 'undefined') {
		albumID = albums.save({
			name: name,
			artist: artist
		});
	} else {
		albumID = album._id;
	}
	return albumID;
};

var removeArtistID = function(id){
	if (songs.find('artist', id).length == 1) {
		artists.remove(id);
	}
};

var removeAlbumID = function(id){
	if (songs.find('album', id).length == 1) {
		albums.remove(id);
	}
};

module.exports.create = function(songData){
	if (songData.artist) {
		songData.artist = addArtistID(songData.artist);
	}
	
	if (songData.album) {
		songData.album = addAlbumID(songData.album, songData.artist);
	}
	return songs.save(songData);
};

module.exports.edit = function(id, songData){
	var old = songs.find('id', id);
	
	if (songData.artist && artists.find('id', old.artist).name != songData.artist) {
		removeArtistID(old.artist);
		songData.artist = addArtistID(songData.artist);
	}
	
	if (songData.album && albums.find('id', old.album).name != songData.album) {
		removeArtistID(old.album);
		songData.album = addAlbumID(songData.album, songData.artist);
	}
	
	songs.update(id, songData);
};

module.exports.remove = function(id){
	songs.remove(id);
};

module.exports.songs = songs;

module.exports.artists = artists;

module.exports.albums = albums;

var dbFile;

module.exports.file = function(file){
	dbFile = file;
};

module.exports.restore = function(file){
	file = file || dbFile;
	var fileContents;
	try {
		fileContents = fs.readFileSync(file);
		module.exports.loadJSON( JSON.parse( fileContents ) );
	} catch (err) {}
};
module.exports.backup = function(file){
	file = file || dbFile;
	fs.writeFile(file, JSON.stringify( module.exports.saveJSON() ));
};

module.exports.loadJSON = function(stuff){
	songs.restore(stuff.songs);
	artists.restore(stuff.artists);
	albums.restore(stuff.albums);
};
module.exports.saveJSON = function(){
	return {
		songs: songs.backup(),
		artists: artists.backup(),
		albums: albums.backup()
	};
};

songs.on('preremove', function(id, song){
	removeArtistID(song.artist);
	removeAlbumID(song.artist);
});
