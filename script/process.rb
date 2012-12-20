#!/usr/bin/ruby
$LOAD_PATH << File.dirname(__FILE__)
require 'process_helper'

# - declare variables, defaults (maybe OptionParser style) - (-b/--s3bucketname) (-a --artist)
options = Parser.new do |p|
  p.banner = "Usage:"

  p.option :artist, "Artist", :default => "Never Go Back"
  p.option :title, "Song title pattern - Use \\f for filename, \\a for artist", :default => "\\f"
  p.option :album, "Album title pattern - Use \\d for dirname", :short =>"l", :default => "Rehearsal \\d"
  p.option :dry_run, "Dry run - only print what will be done", :default => false
  p.option :bitrate, "The encoding rate ala (default 128000)", :short => "ab", :default => "128000"
  p.option :bucket, "The amazon bucket to use", :default => "nevergoback"
end.process!

def doit! options
  file_tags = build_tags(options)
  if options[:dry_run]
    pp file_tags 
    exit 0
  end
  #tag_and_convert! file_tags
  s3ify! file_tags
  # upload tagged mp3 to amazon, create local .mp3.s3 files with URL to s3
  # register/commit new files (git repo)
end

def build_tags options
  # - build up data structure from givens/defaults (filename -> map of tags)
  track_num=1
  whole_dir = File.directory?(ARGV[0]) && ARGV[0]
  dir_files = whole_dir ? `ls -1rt #{whole_dir}/*.*`.split("\n") : ARGV
  wav_files = dir_files.select{ |f| f =~ /\.wav$/i }
  track_count = wav_files.length
  file_opts = wav_files.inject([]) do |all_files, filename|
    mp3name = filename.sub(/\.wav$/i, '.mp3')
    fp = Pathname.new(mp3name)
    this_track = {
      :wavname => filename,
      :mp3name => fp.dirname.to_s + "/" + ("%02d" % track_num) + "_" + fp.basename.to_s,
      :title => options[:title].
        gsub( /\\f/, File.basename(filename, '.*').gsub(/([a-z])[ _\-]?([A-Z])/, '\1 \2') ),
      :artist => options[:artist],
      :track => track_num.to_s + "/" + track_count.to_s,
      :album => options[:album].
        gsub( /\\d/, File.split( File.split(filename)[0] )[1] ).
        gsub( /\\a/, options[:artist]),
      :s3name => "http://#{options[:bucket]}.s3.amazonaws.com/#{fp.dirname.basename}/#{fp.basename}",
      :comments => "Original: #{filename}"
    }
    all_files << this_track
    track_num += 1
    all_files
  end
end

def tag_and_convert! file_opts
  ffmpeg = 'ffmpeg -i #{filewav} -ab #{bitrate} -metadata title="#{title}" -metadata album="#{album}" -metadata artist="#{artist}" #{filemp3}'
  file_opts.each do |file|
    # HACK filenames w/ spaces still dont work too well
    filewav = file[:wavname].sub(' ', '\\ ') 
    filemp3 = file[:mp3name].sub(' ', '\\ ')
    artist = file[:artist]
    album = file[:album]
    title = file[:title]
    bitrate = file[:bitrate]
    overwrite = "-y"
    convcmd = %Q(ffmpeg #{overwrite} -i #{filewav} -ab 128000 -metadata title="#{title}" -metadata album="#{album}" -metadata artist="#{artist}" #{filemp3})
    datemod = %Q(touch -r #{filewav} #{filemp3})
    # $stderr.puts [convcmd, datemod].join("\n")
    system convcmd
    system datemod
  end
end

def s3ify! file_opts
  file_opts.each do |file|
    mp3file = file[:mp3name]
    s3proxyfile = file[:mp3name]+".s3"
    
    File.open(s3proxyfile, "w") do |f|
      f.write file[:s3name]
    end
    datemod = %Q(touch -r #{mp3file} #{s3proxyfile})
    system datemod
  end  
end

doit! options

