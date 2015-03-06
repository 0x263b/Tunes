# encoding: utf-8
require 'rubygems'
require_relative './mini_exiftool.rb'
require 'open-uri'
require 'json'
require 'cgi'


# Config
DBFILE   = "database.json" # if you change this, change L6 of server.js too 
MUSICDIR = ""

def save_database(db)
	File.open(DBFILE, "w") do |f|
		f.write(JSON.pretty_generate(db))
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
	if title.nil? or title == 0
		file = file.split('/')
		return file.last.gsub(".mp3", "").strip
	else
		return title.to_s.strip
	end
end

# Temporary
song_id   = 0
artist_id = 0
album_id  = 0

artist = Hash.new
album  = Hash.new

database = {
	:songs => {
		:data => Hash.new,
		:indexes => {
			:artist => Hash.new,
			:album  => Hash.new
		}
	},
	:artists => {
		:data => Hash.new,
		:indexes => {
			:name  => Hash.new
		}
	},
	:albums => {
		:data => Hash.new,
		:indexes => {
			:artist => Hash.new,
			:name  => Hash.new
		}
	}
}


Dir.glob(MUSICDIR + "/**/*.mp3") do |file|
	song_id += 1

	tag = MiniExiftool.new file

	database[:songs][:data][song_id.to_s] = { 
		:track       => make_number(tag.track),
		:disc        => make_number(tag.part_of_set),
		:title       => make_title(file, tag.title),
		:length      => make_length(tag.duration),
		:artist      => tag.artist.strip,
		:albumartist => (tag.album_artist.nil?) ? (tag.artist.strip) : (tag.album_artist.strip),
		:album       => tag.album.strip,
		:genre       => tag.genre,
		:bitrate     => make_bitrate(tag.audio_bitrate),
		:file        => file,
		:_id         => song_id
	}


	artist_id += 1 unless artist.has_key?(tag.artist.strip)
	album_id  += 1 unless album.has_key?(tag.album.strip)

	# List of artists
	if artist.has_key?(tag.artist.strip)
		# songs
		database[:songs][:indexes][:artist][artist[tag.artist.strip].to_s][song_id.to_s] = true
		database[:songs][:data][song_id.to_s][:artist] = artist[tag.artist.strip]
	else
		#songs
		artist[tag.artist.strip] = artist_id
		database[:songs][:indexes][:artist][artist_id.to_s] = {song_id.to_s => true}


		url = open("http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=#{CGI.escape(tag.artist)}&api_key=3872f32cbb27fb864541c191f4c9f919&format=json").read
		lastfm = JSON.parse(url)

		if lastfm.has_key?("artist") and lastfm["artist"]["image"][0].has_key?("#text")
			art_url = lastfm["artist"]["image"][0]["#text"]
		else
			art_url = "no-art.png"
		end


		# artists
		database[:artists][:data][artist[tag.artist.strip].to_s] = {:name => tag.artist.strip, :art => art_url, :_id => artist_id}
		database[:artists][:indexes][:name][tag.artist.strip] = {artist_id.to_s => true}
		database[:songs][:data][song_id.to_s][:artist] = artist_id
	end

	# List of albums
	if album.has_key?(tag.album.strip)
		# songs
		database[:songs][:indexes][:album][album[tag.album.strip].to_s][song_id.to_s] = true
		database[:songs][:data][song_id.to_s][:album] = album[tag.album.strip]
	else
		artist_temp = artist[tag.artist.strip]
		
		# songs
		album[tag.album.strip] = album_id
		database[:songs][:indexes][:album][album_id.to_s] = {song_id.to_s => true}

		#albums
		url = open("http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=3872f32cbb27fb864541c191f4c9f919&artist=#{CGI.escape(tag.artist)}&album=#{CGI.escape(tag.album)}&format=json").read
		lastfm = JSON.parse(url)

		if lastfm.has_key?("album") and lastfm["album"]["image"][3].has_key?("#text")
			art_url = lastfm["album"]["image"][3]["#text"]
		else
			art_url = "no-art.png"
		end

		database[:albums][:data][album_id.to_s] = {:name => tag.album.strip, :artist => artist_temp, :art => art_url, :_id => album_id}
		database[:albums][:indexes][:name][tag.album.strip] = {album_id.to_s => true}
		
		if database[:albums][:indexes][:artist].has_key?(artist_temp.to_s)
			database[:albums][:indexes][:artist][artist_temp.to_s][album_id.to_s] = true
		else 
			database[:albums][:indexes][:artist][artist_temp.to_s] = {album_id.to_s => true}
		end
		database[:songs][:data][song_id.to_s][:album] = album_id
	end


	puts "S:#{song_id} Ar:#{artist_id} Al:#{album_id} > #{file}"
end

# songs
database[:songs][:iterator] = database[:songs][:data].length

# artists
database[:artists][:iterator] = database[:artists][:data].length

# albums
database[:albums][:iterator] = database[:albums][:data].length


save_database(database)

