# Tunes

Example installation &rarr; [http://tfwnogf.info/music/](http://tfwnogf.info/music/)

---

**Server installation**

* `npm install`
* `nano node_modules/express/node_modules/send/lib/send.js`
* Change [line 160](https://github.com/visionmedia/send/blob/master/lib/send.js#L160) to `return !this._root && ~this.path.indexOf('../');`
	* This line prevents express from serving up files/directories with `..` in the name. If you somehow never run into this problem, leave it alone.

Building the database (requires ruby)

* Install exiftool from your package manager
* `gem install mini_exiftool open-uri json`
* Now you have to edit the mini_exiftool gem
	* `cd` to where the gem is installed. In my case it is `cd /usr/local/rvm/gems/ruby-2.0.0-p247/gems/mini_exiftool-2.3.0/lib`
	* `nano mini_exiftool.rb`
	* comment out [lines 414 and 415](https://github.com/janfri/mini_exiftool/blob/master/lib/mini_exiftool.rb#L414-L415). This rationalizes all fractions which messes up track numbers.
* Change [id3.rb L11](https://github.com/killwhitey/Tunes/blob/master/server/id3.rb#L11) to where you store your music, then run (`ruby id3.rb`).
	
**Client installation**

Serve this however you serve static files; express, sinatra, apache, nginx, etc.