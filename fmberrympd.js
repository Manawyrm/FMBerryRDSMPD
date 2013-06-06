//FMBerry RDS MPD Songinformation Bridge
//Written 2013 by Tobias Mädel (t.maedel@alfeld.de)

//MPD Host
var mpdhost = "127.0.0.1";
var mpdport = "6600";

//FMBerry Host
var fmberryhost = "192.168.178.111";
var fmberryport = 42516;

var mpdSocket = require('./mpdsocket.js');
var mpd = new mpdSocket(mpdhost,mpdport);
mpd.on('connect',function() {
});

var lastid = 0;
setInterval(function() 
  { 
		mpd.send('currentsong',function(r) {
		    if (lastid != r['Id'])
		    {
		    	//Neuer Song :)
				var artist = r['Artist'];
				var title = r['Title'];

				var net = require('net');
				var client = net.connect(fmberryport, fmberryhost,  function(){
				   var rdstext = artist + " - " + title;
				   rdstext = rdstext.substr(0, 63);
				   client.write('set rdstext ' + rdstext);
				});
		    }

		    lastid = r['Id'];
		});
	}, 1000);

