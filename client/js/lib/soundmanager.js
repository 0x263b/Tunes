soundManager.setup({
	url: 'sm2/swf/',
	flashVersion: 9, // optional: shiny features (default = 8)
	useFlashBlock: false, // optionally, enable when you're ready to dive in
	preferFlash: false,
	onready: function(){
		$(document).trigger('soundManager');
	}
});
