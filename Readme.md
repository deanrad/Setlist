Setlist
---------
Setlist is a utility for organizing a bands rehearsal recordings, charts, and other files. It's 
primary philosophy is one of inferred organization - you put things up in the most natural way
for you, and Setlist presents your content in an accessible, linked, utilitarian format.

Note: This is NOT an example of my finest coding, rather a set of utilitarian
hacks that do in fact help my band, but are really selfishly designed for me 
to get in-and-out as quickly as possible. That said - read on !

Lets suppose that after each rehearsal, you put WAV or MP3 files into a folder such as 2011_02_10.

    2011_02_10/
     - 01_SongOne_take1.mp3
     - SongOne_take2.mp3
     - SongOne_best.mp3
     - SongTwo.mp3
     - SongThree_drums_vocals.mp3
 
    2011_01_20/
     - song_one.mp3
     - etc..

and charts have their own folder

    charts/
      - songOne.pdf
      - song_two.pdf

Setlist will match up the various song titles, and collect the resources that together comprise
a given song, a given rehearsal, etc.. 

    Setlist:
       Song One (chart) (recordings)
       Song Two
       Song Three

    Rehearsals:
       February 10
       January 20

(It's desired to eventually allow notes to be taken on a given song, rehearsal, etc..)

The idea is that Setlist is so lightweight, and its database-less design allows for super-easy deployment,
that it will be an improvement over even your Operating System's directory browser, or command-line. Of 
course, that's not to say it's for sissies - rockstars only, please ! 

