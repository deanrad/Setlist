#!/bin/bash
# File: process.sh
# Purpose: Handedited file
# Instructions: Make copy of the file per project to specify the input WAV, the metadata for each one
#
# Example metadata commands
# -metadata date="2012"  
# -metadata album="Streets On Fire Rehearsal 2012-11-10"
# -metadata title="Devil's Express"
# -metadata artist="JD Dean Federico"
# -metadata track="3/12" (means track number 3 of 12)
# -metadata TKEY="E"
# -metadata TBPM="120"
set -x
ffmpeg -i ZOOM0025.WAV -y -ab 128000 -ss 150 -t 303 -metadata title="Devil's Express" -metadata album="Streets On Fire Rehearsal 2012-11-10" -metadata artist="JD Dean Federico" DevilsExpress.mp3
