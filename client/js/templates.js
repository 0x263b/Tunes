var templates = {};

templates.row = function(data){
	return '<tr class="song" data-id="'+data._id+'">'+
		'<td class="track">'+(data.track || '')+'</td>'+
		'<td class="title">'+data.title+'</td>'+
		'<td class="length">'+data.length+'</td>'+
	'</tr>';
};
