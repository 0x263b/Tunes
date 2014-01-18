var Player = function(){
	this.queue = [];
	this.queuePosition = 0;
};

Player.prototype = EventEmitter.prototype;

Player.prototype.hasBeenPlayed = false;
Player.prototype.paused = false;

Player.prototype.newSong = function(songID, position){
	if (!songID) {
		songID = this.queue[ this.queuePosition ][1];
		songDB = DB.get( this.queue[ this.queuePosition ][0] );
	} else if (typeof songID == 'object'){
		songDB = songID[0];
		songID = songID[1];
	} else {
		songDB = DB.current();
	}
	this.songData = $.extend({},
		songDB.getSong(songID),
		{
			file: songDB.url(songID),
			db: songDB.server+':'+songDB.port
		});
	
	this.stop();
	if (this.sound) {
		this.sound.destruct();
	}
	
	var self = this;
	
	this.sound = soundManager.createSound({
		id: 'sound',
		url: this.songData.file,
		onfinish: function(){
			self.sound.destruct();
			self.emit('stop');
			self.emit('finish');
		},
		onpause: function(){ self.emit('pause') },
		onresume: function(){ self.emit('resume') },
		onplay: function(){ self.emit('play') },
		onstop: function(){ self.emit('stop') },
		whileplaying: function(){ self.emit('playing') }
	});
	
	if (this.paused) {
		this.sound.load();
	} else {
		this.play();
	}
	
	if (position) {
		this.sound.setPosition(position);
	}
	
	this.emit('newSong');
};

Player.prototype.play = function(){
	if (this.sound) {
		this.paused = false;
		if (this.hasBeenPlayed) {
			this.sound.resume();
		} else {
			this.sound.play();
			this.hasBeenPlayed = true;
		}
	}
};

Player.prototype.pause = function(){
	this.paused = true;
	this.sound.pause();
};

Player.prototype.stop = function(){
	if (this.sound) {
		this.sound.setPosition(0);
		this.sound.stop();
		this.sound.destruct();
		delete this.sound;
		this.hasBeenPlayed = false;
	}
	if (this.paused) {
		this.emit('stop');
	}
};

Player.prototype.back = function(){
	if (this.sound.position > 5000) {
		this.sound.setPosition(0);
		this.emit('position', 0);
	} else {
		this.previous();
	}
};
Player.prototype.previous = function(){
	this.stop();
	this.emit('previous');
	if (this.queue[ this.queuePosition-1 ]) {
		this.queuePosition--;
		this.newSong();
	}
};

Player.prototype.next = function(){
	this.stop();
	this.emit('next');
	if (this.queue[ this.queuePosition+1 ]) {
		this.queuePosition++;
		this.newSong();
	}
};

var player = new Player();
