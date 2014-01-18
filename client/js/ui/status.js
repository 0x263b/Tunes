(function(){

var body = $('body');
var loading = $('.loading');
var error = $('.error');

body.on('loading', function(){
	error.removeClass('visible');
	loading.addClass('visible');
});

body.on('loaded', function(){
	error.removeClass('visible');
	loading.removeClass('visible');
});

body.on('error', function(ev, args){
	error.find('h2').text(args.title);
	error.find('h2').prepend('<i class="icon-exclamation-sign"></i> ');
	error.find('p').text(args.text);
	error.attr('class', 'error');
	error.addClass(args.type);
	error.addClass('visible');
	loading.removeClass('visible');
});

})();
