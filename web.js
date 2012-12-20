var async    = require('async');
var express  = require('express');
var util     = require('util');
var fs       = require('fs');
var readdirp = require('readdirp'); 
var chomp    = require('chomp');
var rest     = require('restler');

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
          if( entry.path.indexOf('.appcache') > -1 ){
            //dont show
          }
          else if( entry.path.indexOf('.youtube') > -1 ){
            matches.push( { name: entry.path, path: fs.readFileSync('./public/' + entry.path, "UTF8").chomp(), mtime: entry.stat.mtime, subtype: "video/youtube" } );
          }
          else if( entry.path.indexOf('.mp3.s3') > -1 ){
            matches.push( { name: entry.path, path: fs.readFileSync('./public/' + entry.path, "UTF8").chomp(), mtime: entry.stat.mtime } );
          }
          else{
            matches.push( { name: entry.path, path: '/'+entry.path, mtime: entry.stat.mtime } );
          }
        }
      },
      // on completion  
	  function (err, resp) {
	      var sorted = matches.sort( function(a,b){
	        return a.mtime - b.mtime;
	      });
        res.render('search.ejs', {title: "Search Results for " + url , matches: sorted, layout: false, showFullNav: false, status: 200, url: req.url, path: req.url}); 
      }
    );

  }
});

app.helpers({
  'render_match': function(m){
    var audio = " <audio src='" + m.path + "' type='audio/mp3' controls='controls' preload='metadata'></audio>";
    return " <li>\n" + 
           "  <a href='" + m.path + "'>" + m.name.replace( /\.s3$/, '') + "</a>\n" + 
           (m.path.match( /\.mp3/i ) ? audio : "") + 
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


