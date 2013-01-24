var async    = require('async');
var express  = require('express');
var util     = require('util');
var fs       = require('fs');
var http     = require('http');
var readdirp = require('readdirp'); 
var chomp    = require('chomp');
var rest     = require('restler');
var AdmZip = require('adm-zip');

// create an express webserver
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.bodyParser(),
  express.cookieParser(),
  // set this to a secret value to encrypt session cookies
  express.session({ secret: process.env.SESSION_SECRET || 'secret123' }),
  require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID,
    secret: process.env.FACEBOOK_SECRET,
    scope:  'user_likes,user_photos,user_photo_video_tags'
  })
);

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Listening on " + port);
});

app.get('/', handle_facebook_request);
app.post('/', handle_facebook_request);
app.get('/getzip.zip', handle_zipper)

//my custom 404 thing
app.use(function(req, res, next){
  var url = unescape(req.url).toLowerCase().replace(' ', '').slice(1);

  if( url.indexOf('running') > -1)        { res.redirect('/running.html'); }
  else if( url.indexOf('joggling') > -1 ) { res.redirect('http://www2.brightroom.com/107440/5574'); }
  else{
    var matches = [];
    readdirp( { root: './public' }, 
      //on a directory entry 
      function(entry){
        if( entry.path.toLowerCase().indexOf( url ) > -1 ){
          if( entry.path.indexOf('.appcache') > -1  || entry.path.indexOf('/_') > -1){
            //dont show
          }
          else if( entry.path.indexOf('.youtube') > -1 ){
            var content = fs.readFileSync('./public/' + entry.path, "UTF8").chomp();
            matches.push( { name: entry.path, path: entry.path, source: content, mtime: entry.stat.mtime, subtype: "video/youtube" } );
          }
          else if( entry.path.indexOf('.mp3.s3') > -1 ){
            var content = fs.readFileSync('./public/' + entry.path, "UTF8").chomp()
            matches.push( { name: entry.path, path: entry.path, source: content, mtime: entry.stat.mtime } );
          }
          else{
            matches.push( { name: entry.path, path: entry.path, source: '/'+entry.path, mtime: entry.stat.mtime } );
          }
        }
      },
      // on completion  
	  function (err, resp) {
	      matches.sort( function(a,b){
	        var acmp = a.name;
	        var bcmp = b.name;
          return acmp.localeCompare(bcmp);
	      });
        res.render('search.ejs', {title: "Search Results for " + url , matches: matches, layout: false, showFullNav: false, status: 200, url: req.url, path: req.url}); 
      }
    );

  }
});

app.helpers({
  'render_match': function(m){
    var audio = " <audio src=\"" + m.source + "\" type='audio/mp3' controls='controls' preload='metadata'></audio>";
    var video = "  <video controls='controls' preload='metadata'><source src='" + m.source + "' type='video/youtube'></source></video>\n";
    var incaudio = m.path.match( /\.mp3/i );
    var incvideo = (m.subtype == "video/youtube");

	var disppath = (m.name.indexOf('s3') > -1) ? m.source : m.path ;
	//var disppath = m.source;
    var dispname = m.name.replace( /\.s3$/, '');
    var dispshort = dispname.replace( /^.*\//, '');
	
    return " <li>\n" + 
           "<span title=\"" + m.path + "\">" + dispshort + "</span>" +
           "  <a title=\"" + disppath + "\" href=\"" + m.source + "\">Download</a>\n" + 
           (incaudio ? audio : "") + 
           (incvideo ? video : "") + 
           " </li>";
  }
});


app.dynamicHelpers({
  'host': function(req, res) {
    return req.headers['host'];
  },
  'scheme': function(req, res) {
    req.headers['x-forwarded-proto'] || 'http'
  },
  'url': function(req, res) {
    return function(path) {
      return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(path);
    }
  },
  'url_no_scheme': function(req, res) {
    return function(path) {
      return '://' + app.dynamicViewHelpers.host(req, res) + path;
    }
  },
});

function render_page(req, res) {
  req.facebook.app(function(app) {
    req.facebook.me(function(user) {
      res.render('index.ejs', {
        layout:    false,
        req:       req,
        app:       app,
        user:      user
      });
    });
  });
}

function handle_zipper(req, res) {
	var searchpath = req.query.path;
	var url = unescape(searchpath).toLowerCase().replace(' ', '').slice(1);
	
	res.setHeader('Content-Type', 'text/html');
	res.send(new Buffer('Coming soon: getting zip' + req.query.path));
	
	/*
    var zip = new AdmZip();
    readdirp( { root: './public' }, 
      function(entry){
		if( entry.path.toLowerCase().indexOf( url ) > -1 ){
	      if( entry.path.indexOf('.mp3.s3') > -1 ){
            var s3source = fs.readFileSync('./public/' + entry.path, "UTF8").chomp();
			rest.get(s3source).on('complete', function(result) {
			  if (result instanceof Error) {
			  } else {
				console.log("added s3 file " + s3source);
			    var b = new Buffer(result);
				zip.addFile(entry.path, b);
			  }
			});
          }
          else{
			var contents = fs.readFileSync('./public/' + entry.path);
			console.log("added local file " + entry.path);
			var b = contents;
            zip.addFile( entry.path, b );
          }
		}
      },
      // on completion  
	  function (err, resp) {
		console.log("sending zip");
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', 'attachment; filename=funmusic.zip')
        res.send(zip.toBuffer());
      }
    );	*/
	
}

function handle_facebook_request(req, res) {

  // if the user is logged in
  if (req.facebook.token) {

    async.parallel([
      function(cb) {
        // query 4 friends and send them to the socket for this socket id
        req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
          req.friends = friends;
          cb();
        });
      },
      function(cb) {
        // query 16 photos and send them to the socket for this socket id
        req.facebook.get('/me/photos', { limit: 16 }, function(photos) {
          req.photos = photos;
          cb();
        });
      },
      function(cb) {
        // query 4 likes and send them to the socket for this socket id
        req.facebook.get('/me/likes', { limit: 4 }, function(likes) {
          req.likes = likes;
          cb();
        });
      },
      function(cb) {
        // use fql to get a list of my friends that are using this app
        req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(result) {
          req.friends_using_app = result;
          cb();
        });
      }
    ], function() {
      render_page(req, res);
    });

  } else {
    render_page(req, res);
  }
}


