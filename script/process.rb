#!/usr/bin/ruby
$LOAD_PATH << File.dirname(__FILE__)
require 'process_helper'

# - declare variables, defaults (maybe OptionParser style) - (-b/--s3bucketname) (-a --artist)
options = Parser.new do |p|
  p.banner = "Usage:"

  p.option :artist, "Artist", :default => ""
  p.option :title_template, "Song title pattern - Use \\f for filename, \\a for artist", :default => "\\f"
#  p.option :log_level, "Logging level: 1-error 2-warn 3-info 4-debug", :default => ""
end.process!

file_opts = ARGV.inject({}) do |all_files, filename|
  opts[:title] = opts.delete(:title_template).gsub( /\\f/, File.basename(filename) )
  all_files[filename] = opts
  all_files
end

y file_opts
# - build up data structure from givens/defaults (filename -> map of tags)
#   - ffmpeg convert each file to tagged mp3
#   - upload tagged mp3 to amazon
#   - create local proxy files .mp3.s3 with URL to s3 destination
# - register new files (git repo)
