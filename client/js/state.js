if ('localStorage' in window && window['localStorage'] !== null) {
(function(){

player.on('newSong', function(){
	if (typeof player.songData._id == 'undefined') {
		return;
	}
	var songPath = player.songData.db+'/'+player.songData._id;
	localStorage.currentSong = songPath;
	localStorage.queue = JSON.stringify(player.queue);
	localStorage.queuePosition = player.queuePosition;
});

player.on('stop', function(){
	delete localStorage.currentSong;
	delete localStorage.currentPosition;
});

player.on('position', function(pos){
	localStorage.currentPosition = pos;
});

var state = {
	mode: false
};

function pad(n) {
    if (n < 10)
        return "0" + n;
    return n;
}

$('body').on('state', function(e){
	var newState = e.data;
	var oldState = $.extend(true, {}, state);
	state = $.extend(true, state, newState);
	
	$('body').trigger('stateChange', state);
	
	var dbState = state.dbs ? (state.dbs[state.db] || {}) : {};
	var oldDbState = oldState.dbs ? (oldState.dbs[oldState.db] || {}) : {};
	
	localStorage.state = JSON.stringify(state);
	
	if (newState.mode == 'queue') {
		renderSongs(player.queue);
	} else if (newState.mode == 'db') {
		if (!DB.current( state.db )) {
			$('body').trigger('loading');
			
			var loaded = false;
			
			DB.current().once('status', function(status){
				if (status == 'closed' && loaded == false) {
					$('body').trigger('error', {title: 'Server is offline', text:'I couldn\'t find any music over there', type: 'waffle'});
				}
			});
			
			DB.current().findArtists(function(){
				loaded = true;
				
				$('body').trigger('loaded');
				
				var artists = DB.current().artists;
				
				var html = '';
		
				sortObject(artists, function(a, b){
					return a[0].localeCompare(b[0]);
				}, function(id, artist){
					if (id == dbState.artist) {
						html += '<li data-id="'+id+'" class="active"><span class="album-art" style="background-image:url(\''+ artist[1] +'\')"></span><span class="artist">'+ artist[0] +'</span></li>';
					} else {
						html += '<li data-id="'+id+'"><span class="album-art" style="background-image:url(\''+ artist[1] +'\')"></span><span class="artist">'+ artist[0] +'</span></li>';
					}
				});
				
				$('.filters .artists ul').html(html);
				if (!dbState.artist) {
					$('.filters .artists li').first().trigger('click');
				}
			});
		}
	}
	

	
	if (state.mode == 'db' &&
		dbState.artist && 
		(oldState.mode != 'db' ||
		dbState.album != oldDbState.album ||
		(dbState.artist != oldDbState.artist && dbState.album == 0))) {
		var current = DB._current;
		
		var db = DB.current();
		
		db.findSongsByArtist(dbState.artist, function(list){
			if (DB._current != current) return;
			var newList = [];
			for (var i in list) {
				if (dbState.album == 0 || db.songs[list[i]].album == dbState.album) {
					newList.push(list[i]);
				}
			}
			newList.sort(function(a, b){
				if (db.songs[a].album != db.songs[b].album) {
					return db.albums[db.songs[a].album].localeCompare(db.albums[db.songs[b].album]);
				} else {
					return parseFloat((db.songs[a].disc || 1) + '.' + pad(db.songs[a].track)) - parseFloat((db.songs[b].disc || 1) + '.' + pad(db.songs[b].track));
				}
			});
			renderSongs(newList);
		});
	}
});

$(function(){

if (localStorage.queue) {
	player.queue = JSON.parse(localStorage.queue);
}
if (localStorage.queuePosition) {
	player.queuePosition = localStorage.queuePosition*1;
}

if (localStorage.state) {
	$('body').trigger('state', JSON.parse(localStorage.state));
} else {
	$('body').trigger('state', {
		mode: 'db',
		db: location.hostname,
		dbs: {}
	});
}

if (localStorage.currentSong) {
	var pathParts = localStorage.currentSong.split('/');
	var dbParts = pathParts[0].split(':');
	
	var host = dbParts[0];
	var port = dbParts[1];
	var id = pathParts[1];
	
	var db = DB.get(host, port);
	db.findSong(id, function(){
		player.paused = true;
		player.newSong([db, id], localStorage.currentPosition);
	});
}

});

})();
}
