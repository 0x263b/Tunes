player.on('finish', function(){
	$('body').removeClass('playing');
	$('body').addClass('paused');
});
player.on('pause', function(){
	$('body').removeClass('playing');
	$('body').addClass('paused');
});
player.on('stop', function(){
	$('body').removeClass('playing');
	$('body').addClass('paused');
});
player.on('play', function(){
	$('body').addClass('playing');
	$('body').removeClass('paused');
});
player.on('resume', function(){
	$('body').addClass('playing');
	$('body').removeClass('paused');
});
player.on('finish', function(){
	player.next();
});

$('.controls .play').click(function(){
	if (!player.sound && currentSongList.length) {
		player.queue = [];
		for (var i in currentSongList) {
			player.queue.push([DB._current, currentSongList[i]]);
		}
		player.queuePosition = 0;
		player.newSong();
	}
	player.play();
});
$('.controls .pause').click(function(){
	player.pause();
});
$('.controls .stop').click(function(){
	player.stop();
});
$('.controls .next').click(function(){
	player.next();
});
$('.controls .previous').click(function(){
	player.back();
});
