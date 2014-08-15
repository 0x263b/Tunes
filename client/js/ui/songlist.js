var leadingZero = function(num){
	if (num < 10) {
		num = '0'+num;
	}
	return num;
};
var makeLength = function(len){
	len = Math.floor(len);
	var minutes = Math.floor(len/60);
	var hours = Math.floor(minutes/60);
	var seconds = len;
	if (minutes) {
		seconds -= minutes*60;
	}
	if (hours) {
		minutes -= hours*60;
		minutes = leadingZero(minutes);
	}
	seconds = leadingZero(seconds)
	return ((hours) ? hours+':' : '')+minutes+':'+seconds;
};

var currentSongList = [];

var renderSongs = function(songIDs){
	currentSongList = songIDs;
	
	DB.getSongs(songIDs, function(list){
		$('article .songList').html('');
		$('article .songList').append('<aside class="header"><h1>'+ list[0].artist +'</h1><span class="total-albums">Albums: </span> <span class="total-tracks">Songs: </span></aside>');
		
		for (var i in list) {
			if(!$('article .songList div[data-album="'+ list[i].album +'"]').length) {
				$('article .songList').append(
					'<div data-album="'+ list[i].album +'"> \
						<div class="album-art"> \
							<img src="no-art.png" alt="" /> \
						</div> \
						<div class="album-tracks"> \
							<table> \
								<tr><th colspan="3">'+ list[i].album +'</th></tr> \
							</table> \
						</div> \
					</div>'
				);
			}
			$('article .songList div[data-album="'+ list[i].album +'"] table').append(templates.row( $.extend({}, list[i], {length: makeLength(list[i].length)}) ));
		}
		$('article .songList .header .total-albums').append($('div.album-tracks').size() + ', ');
		$('article .songList .header .total-tracks').append($('td.title').size());
		$('article .songList div').each(function(index){
			var artist = $('article .songList h1').text();
			var album = $(this).attr('data-album');
			$.getJSON('http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=3872f32cbb27fb864541c191f4c9f919&artist='+ encodeURIComponent(artist) +'&album='+ encodeURIComponent(album) +'&format=json&callback=?', function(data){
				var album_art = (data.album.image[3]['#text'] || 'no-art.png');
				$('div[data-album="'+ album +'"] .album-art img').attr('src', album_art);
			});
			
		});
	});
};



$('.songList').on('dblclick', '.song', function(){
	player.queue = [];
	for (var i in currentSongList) {
		player.queue.push([DB._current, currentSongList[i]]);
	}
	player.queuePosition = $('.songList .song').index(this);
	player.newSong();
	player.play();
});

$('.songList').on('mousedown', '.song', function(){
	$('.songList .active').removeClass('active');
	$(this).addClass('active');
});

