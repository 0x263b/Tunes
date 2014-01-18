$('aside dl').on('click', 'dd.queue:not(.active)', function(){
	$('body').trigger('state', {
		mode: 'queue'
	});
});

$('aside dl').on('click', 'dd.library:not(.active)', function(){
	$('body').trigger('state', {
		mode: 'db',
		db: $(this).data('source')
	});
});

$('body').on('state', function(e){
	var newState = e.data;
	var el;
	if (newState.mode == 'db') {
		el = $('aside dl dd.library[data-source="'+newState.db+'"]');
	} else if (newState.mode == 'queue') {
		el = $('aside dl dd.queue');
	}
	if (el) {
		el.siblings('.active').removeClass('active');
		el.addClass('active');
	}
});
