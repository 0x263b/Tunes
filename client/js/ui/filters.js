$('.filters').on('click', 'li', function(){
	$(this).parent().parent().trigger('change', {
		item: $(this).data('id') || $(this).text()
	});
});

/*
$('.filters').on('dblclick', 'li', function(){
	if ($(this).hasClass('active')) {
		$('.songList>tr:first-child').trigger('dblclick');
	}
});
*/
$('.filters .artists').on('change', function(e){
	var newStuff = {dbs: {}};
	newStuff.dbs[DB._current] = {
		artist: e.data.item,
		album: 0
	};
	$('body').trigger('state', newStuff);
});
/*
$('.filters .albums').on('change', function(e){
	var newStuff = {dbs: {}};
	newStuff.dbs[DB._current] = {
		album: e.data.item
	};
	$('body').trigger('state', newStuff);
});
*/
$('body').on('stateChange', function(e){
	var state = e.data;
	if (state.dbs[state.db] && state.dbs[state.db].artist) {
		$('.filters .artists .active').removeClass('active');
		$('.filters .artists li[data-id="'+state.dbs[state.db].artist+'"]').addClass('active');
	}
	
	if (state.dbs[state.db] && state.dbs[state.db].album) {
		$('.filters .albums .active').removeClass('active');
		$('.filters .albums li[data-id="'+state.dbs[state.db].album+'"]').addClass('active');
	}
});

