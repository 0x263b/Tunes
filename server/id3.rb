# encoding: utf-8
require 'rubygems'
require './mini_exiftool'
require 'open-uri'
require 'json'
require 'cgi'


# Config
$DBFILE   = "database.json" # if you change this, change L6 of server.js too 
$MUSICDIR = "./music"



if File.exist? $DBFILE
	File.open($DBFILE, "r") do |f|
		$DataBase = JSON.parse(f.read)
		$DataBase.default = 0
	end
	puts 'opened database'
else
	puts 'making file'
	$DataBase = Hash.new(0)
end

def save_DB
	File.open($DBFILE, "w") do |f|
		f.write($DataBase.to_json)
	end
	puts 'saved database'
end



def make_length(len)
	len = len.split(' ')
	len = len[0].split(':')

	len[0] = len[0].to_i
	len[1] = len[1].to_i
	len[2] = len[2].to_i

	return ((len[0]*3600)+(len[1]*60)+len[2])
end

def make_bitrate(bitrate)
	bitrate = bitrate.split(' ')
	return bitrate[0].to_i
end

def make_number(num)
	num = num.to_s.split('/')
	(num[0].nil?) ? (return nil) : (return num[0].to_i)
end

def make_title(file, title)
	if title.length < 1
		file = file.split('/')
		return file.last.gsub(".mp3", "").strip
	else
		return title.strip
	end
end

# Temporary
song_id = 0
artist_id = 0
album_id = 0

artist = Hash.new
album = Hash.new

# Saved
$DataBase['songs'] = Hash.new
$DataBase['songs']['data'] = Hash.new
$DataBase['songs']['indexes'] = Hash.new
$DataBase['songs']['indexes']['artist'] = Hash.new
$DataBase['songs']['indexes']['album'] = Hash.new

$DataBase['artists'] = Hash.new
$DataBase['artists']['data'] = Hash.new
$DataBase['artists']['indexes'] = Hash.new
$DataBase['artists']['indexes']['name'] = Hash.new

$DataBase['albums'] = Hash.new
$DataBase['albums']['data'] = Hash.new
$DataBase['albums']['indexes'] = Hash.new
$DataBase['albums']['indexes']['name'] = Hash.new
$DataBase['albums']['indexes']['artist'] = Hash.new


Dir.glob($MUSICDIR + "/**/*.mp3") do |file|
	song_id += 1

	puts "#{song_id} > #{file}"

	tag = MiniExiftool.new file

	$DataBase['songs']['data'][song_id.to_s] = { 
		"track"       => make_number(tag.track),
		"disc"        => make_number(tag.part_of_set),
		"title"       => make_title(file, tag.title),
		"length"      => make_length(tag.duration),
		"artist"      => tag.artist.strip,
		"albumartist" => (tag.album_artist.nil?) ? (tag.artist.strip) : (tag.album_artist.strip),
		"album"       => tag.album.strip,
		"genre"       => tag.genre,
		"bitrate"     => make_bitrate(tag.audio_bitrate),
		"file"        => file,
		"_id"         => song_id
	}

	# List of artists
	if artist.has_key?(tag.artist.strip)
		# songs
		$DataBase['songs']['indexes']['artist'][artist[tag.artist.strip].to_s][song_id.to_s] = true
	else
		artist_id += 1

		#songs
		artist[tag.artist.strip] = artist_id
		$DataBase['songs']['indexes']['artist'][artist_id.to_s] = {song_id.to_s => true}


		url = open("http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=#{CGI.escape(tag.artist)}&api_key=3872f32cbb27fb864541c191f4c9f919&format=json").read
		lastfm = JSON.parse(url)

		if lastfm.has_key?("artist") and lastfm["artist"]["image"][0].has_key?("#text")
			art_url = lastfm["artist"]["image"][0]["#text"]
		else
			art_url = "no-art.png"
		end


		# artists
		$DataBase['artists']['data'][artist[tag.artist.strip].to_s] = {"name" => tag.artist.strip, "art" => art_url, "_id" => artist_id}
		$DataBase['artists']['indexes']['name'][tag.artist.strip] = {artist_id.to_s => true}
	end

	# List of albums
	if album.has_key?(tag.album.strip)
		# songs
		$DataBase['songs']['indexes']['album'][album[tag.album.strip].to_s][song_id.to_s] = true
	else
		album_id += 1
		artist_id = artist[tag.artist.strip]
		
		# songs
		album[tag.album.strip] = album_id
		$DataBase['songs']['indexes']['album'][album_id.to_s] = {song_id.to_s => true}

		#albums
		url = open("http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=3872f32cbb27fb864541c191f4c9f919&artist=#{CGI.escape(tag.artist)}&album=#{CGI.escape(tag.album)}&format=json").read
		lastfm = JSON.parse(url)
		puts lastfm

		if lastfm.has_key?("album") and lastfm["album"]["image"][3].has_key?("#text")
			art_url = lastfm["album"]["image"][3]["#text"]
		else
			art_url = "no-art.png"
		end

		$DataBase['albums']['data'][album_id.to_s] = {"name" => tag.album.strip, "artist" => artist_id, "art" => art_url, "_id" => album_id}
		$DataBase['albums']['indexes']['name'][tag.album.strip] = {album_id.to_s => true}
		
		if $DataBase['albums']['indexes']['artist'].has_key?(artist_id.to_s)
			$DataBase['albums']['indexes']['artist'][artist_id.to_s][album_id.to_s] = true
		else 
			$DataBase['albums']['indexes']['artist'][artist_id.to_s] = {album_id.to_s => true}
		end
	end

	$DataBase['songs']['data'][song_id.to_s]['artist'] = artist_id
	$DataBase['songs']['data'][song_id.to_s]['album'] = album_id

end

# songs
$DataBase['songs']['iterator'] = $DataBase['songs']['data'].length

# artists
$DataBase['artists']['iterator'] = $DataBase['artists']['data'].length

# albums
$DataBase['albums']['iterator'] = $DataBase['albums']['data'].length


save_DB

