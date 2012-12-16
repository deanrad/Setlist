#!/usr/bin/ruby
$LOAD_PATH << File.dirname(__FILE__)
require 'process_helper'

# - declare variables, defaults (maybe OptionParser style) - (-b/--s3bucketname) (-a --artist)
options = Parser.new do |p|
  p.banner = "Usage:"

  p.option :artist, "Artist", :default => ""
  p.option :title, "Song title pattern - Use \\f for filename, \\a for artist", :default => "\\f"
  p.option :album, "Album title pattern - Use \\d for dirname", :short =>"l", :default => "Rehearsal \\d"
end.process!

def doit! options
  file_tags = build_tags(options)
  pp file_tags
  #tag_and_convert! file_tags
  # upload tagged mp3 to amazon, create local .mp3.s3 files with URL to s3
  # register/commit new files (git repo)
end

def build_tags options
  # - build up data structure from givens/defaults (filename -> map of tags)
  track_num=0
  whole_dir = File.directory?(ARGV[0]) && ARGV[0]
  dir_files = whole_dir ? `ls -1rt #{whole_dir}/*.*`.split : ARGV
  wav_files = dir_files.select{ |f| f =~ /\.wav$/i }
  track_count = wav_files.length
  file_opts = wav_files.inject([]) do |all_files, filename|
    this_track = {
      :filename => filename,
      :title => options[:title].
        gsub( /\\f/, File.basename(filename, '.*').gsub(/([a-z])[ _\-]?([A-Z])/, '\1 \2') ),
      :artist => options[:artist],
      :track => (track_num += 1).to_s + "/" + track_count.to_s,
      :album => options[:album].
        gsub( /\\d/, File.split( File.split(filename)[0] )[1] ).
        gsub( /\\a/, options[:artist]),
      :comments => "Original: #{filename}"
    }
    all_files << this_track
    all_files
  end
end

def tag_and_convert! file_opts
  ffmpeg = 'ffmpeg -i #{filewav} -ab 128000 -metadata title="#{title}" -metadata album="#{album}" -metadata artist="#{artist}" #{filemp3}'
  file_opts.each do |file|
    filewav = file[:filename].sub(' ', "\\ ")
    filemp3 = file[:filename].sub(/\.wav$/i, '.mp3').sub(' ', "\\ ")
    artist = file[:artist]
    album = file[:album]
    title = file[:title]
    overwrite = "-y"
    convcmd = %Q(ffmpeg #{overwrite} -i #{filewav} -ab 128000 -metadata title="#{title}" -metadata album="#{album}" -metadata artist="#{artist}" #{filemp3})
    datemod = %Q(touch -r #{filewav} #{filemp3})
    # $stderr.puts [convcmd, datemod].join("\n")
    system convcmd
    system datemod
  end
end

doit! options

