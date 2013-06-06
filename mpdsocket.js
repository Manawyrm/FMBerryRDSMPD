/*******
** node-mpdsocket :: an MPD library for node.js
**
** author: Eli Wenig (http://eliwenig.com/) <eli@csh.rit.edu>
**
** copyright (c) 2011 Eli Wenig
** made available under the MIT license
**   http://www.opensource.org/licenses/mit-license.php
**
*******/

var net = require('net');

function mpdSocket(host,port) {
  this.callbacks = [];
	this.commands = [];
	this.i = 0;
	this.response = {};
	this.isOpen = false;
	this.socket = null;
	this.version = "0";

	if (!host) {
		this.host = "localhost";
	} else {
		this.host = host;
	}

	if (!port){
		this.port = 6600;
	} else {
		this.port = port;
	}

	this.open(this.host,this.port);
}

mpdSocket.prototype = {
	handleData: function(data) {
		var lines = data.split("\n");
		for (var l in lines) {
			if (lines[l].match(/^ACK/)) {
				this.response._error = lines[l].substr(10);
				this.response._OK = false;
				this.callbacks.shift()(this.response)
				this.response = {};
				return;
			} else if (lines[l].match(/^OK MPD/)) {
				if (this.version == "0") {
					this.version = lines[l].split(' ')[2];
					return;
				}
			} else if (lines[l].match(/^OK$/)) {
				this.response._OK = true;
				this.i = 0;
				this.callbacks.shift()(this.response);
				this.response = {};
				return;
			} else {
				var attr = lines[l].substr(0,lines[l].indexOf(":"));
				var value = lines[l].substr((lines[l].indexOf(":"))+1);
				value = value.replace(/^\s+|\s+$/g, ''); // trim whitespace
				if (this.response._ordered_list != true) {
					if (typeof(this.response[attr]) != 'undefined') {
						//make ordered list
						var tempResponse = new Object;
						tempResponse[++(this.i)] = this.response;
						this.response = tempResponse;
						this.response._ordered_list = true;
						this.response[++(this.i)] = new Object;
						this.response[this.i][attr] = value;
					} else {
						this.response[attr] = value;
					}
				} else {
					if (typeof(this.response[(this.i)][attr]) != 'undefined' || attr == "playlist" || attr == "file" || attr == "directory") {
						this.response[++(this.i)] = new Object;
						this.response[this.i][attr] = value;
					} else {
						this.response[this.i][attr] = value;
					}
				}
			}
		}
	},

	on: function(event, fn) {
		this.socket.on(event,fn);
	},

	open: function(host,port) {
		var self = this;
		if (!(this.isOpen)) {
			this.socket = net.createConnection(port,host);
			this.socket.setEncoding('UTF-8');
			this.socket.addListener('connect',function() { self.isOpen = true; });
			this.socket.addListener('data',function(data) { self.handleData.call(self,data); self._send(); });
			this.socket.addListener('end',function() { self.isOpen = false; });
		}
	},

	_send: function() {
		if (this.commands.length != 0) this.socket.write(this.commands.shift() + "\n");
	},

	send: function(req,callback) {
		if (this.isOpen) {
			this.callbacks.push(callback);
			this.commands.push(req);
			if (this.commands.length == 1) this._send();
		} else {
			var self = this;
			this.open(this.host,this.port);
			this.on('connect',function() {
				self.send(req,callback);
			});
		}
	}
}

module.exports = mpdSocket;
