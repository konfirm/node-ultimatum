'use strict';

var EventEmitter = require('events').EventEmitter,
	util = require('util');

function Ultimatum(options) {
	var ultimatum = this,
		polymorphic = require('polymorphic'),
		lexer = require('./lexer'),
		queueList = [],
		timer = {
			timeout: null,
			immediate: null
		},
		postpone, parser;

	//  Initialize the EventEmitter from which we have inherited
	EventEmitter.apply(ultimatum, []);

	function init() {
		options = options || {};

		reset(true);
		next();
	}

	function microseconds() {
		return process.hrtime().reduce(function(seconds, nano) {
			return seconds * 1e6 + nano / 1e3;
		});
	}

	function parseTimeFormat(format) {
		var multiplier;
		if (!parser) {
			multiplier = 1;
			parser = lexer({
				//  µ, micro, µs, micros, µsec, microsec, µsecond, microsecond, µseconds, microseconds = 1x µs
				'(?:µ|micro)(?:s(?:ec(?:onds?)?))?': multiplier,

				//  ms, msec, millis, millisec, msecond, millisecond, mseconds, milliseconds = 1000x µs
				'm(?:illi)?s(?:ec(?:onds?)?)?': multiplier *= 1e3,

				//  s, sec, second, seconds = 1000x millisecond
				's(?:ec(?:onds?)?)?': multiplier *= 1e3,

				//  m, min, minute, minutes = 60x second
				'm(?:in(?:utes?)?)?': multiplier *= 60,

				//  h, hour, hours = 60x minute
				'h(?:ours?)?': multiplier *= 60,

				//  d, day, days = 24x hour
				'd(?:ays?)?': multiplier *= 24,

				//  w, week, weeks = 7x day
				'w(?:eeks?)?': multiplier *= 7
			});
		}

		return parser(format);
	}

	function clear() {
		if (timer.timeout) {
			clearTimeout(timer.timeout);
		}

		if (timer.immediate) {
			clearImmediate(timer.immediate);
		}
	}

	function queueItem(timeout, done, repeat, locked) {
		var start = microseconds();

		queue({
			start: start,
			end: start + timeout,
			timeout: timeout,
			locked: !!locked,
			callback: done,
			repeat: arguments.length > 2 ? +repeat : Infinity,
			type: arguments.length > 2 && !!repeat ? 'interval' : (locked ? 'at' : 'timeout')
		});
	}

	function queue(item) {
		queueList.push(item);

		queueList = queueList.sort(function(a, b) {
			return a.end - b.end;
		});

		reset();
		next();
	}

	function reset(counter) {
		clear();

		if (counter) {
			postpone = 0;
		}
	}

	function next() {
		var item, delta;

		if (queueList.length) {
			//  we always trust the first item to be the first in line
			item = queueList[0];
			delta = item.end - microseconds();

			if (delta < 50) {
				//  remove the item from the queue and schedule it _in front_ of the call stack
				item = queueList.shift();

				//  if the item needs to be repeated, queue a new one based on this item
				if (item.repeat > 0) {
					queueItem(item.timeout, item.callback, item.repeat - 1);
				}

				item.overdue = microseconds() - item.end;
				item.callback.apply(null, [null, item]);
				ultimatum.emit(item.type, item);

				if (queueList.length && queueList[0].end - item.end < 50) {
					next();
				}
				else {
					process.nextTick(next);
				}
			}
			else if (delta < 1000) {
				timer.immediate = setImmediate(function() {
					clear();
					next();
				});
			}
			else {
				timer.timeout = setTimeout(function() {
					clear();
					next();
				}, Math.floor(delta / 1e3) - 1e3);
			}
		}
		else {
			ultimatum.emit('finished');
		}
	}

	ultimatum.at = polymorphic();
	ultimatum.at.signature('Date date, function callback', function(date, callback) {
		return ultimatum.at(+date * 1e3, callback);
	});

	ultimatum.at.signature('string format, function callback', function(format, callback) {
		return ultimatum.at(parseTimeFormat(format), callback);
	});

	ultimatum.at.signature('number microseconds, function callback', function(micro, callback) {
		//  queue the trigger
		queueItem(micro, callback, false, true);

		return ultimatum;
	});

	ultimatum.timeout = polymorphic();
	ultimatum.timeout.signature('string format', function(format) {
		ultimatum.timeout(parseTimeFormat(format) / 1e3);
	});

	ultimatum.timeout.signature('string format, function callback', function(format, callback) {
		ultimatum.timeout(parseTimeFormat(format) / 1e3, callback);
	});

	ultimatum.timeout.signature('number ms', function(ms) {
		ultimatum.timeout(ms, function() {
			//  trigger the anonymous timeout
		});
	});

	ultimatum.timeout.signature('number ms, function callback', function(ms, callback) {
		queueItem(ms * 1e3, callback, 0);
	});

	//  increment the end time of all active timeouts and intervals with duration (ms)
	ultimatum.postpone = function(duration) {
		//  clear any scheduled items
		clear();

		//  move everything forward which is not locked
		queueList.forEach(function(item) {
			if (!item.locked) {
				if (!('postpone' in item)) {
					item.postpone = [];
				}

				item.postpone.push(duration);

				item.end += duration * 1e3;
			}
		});

		//  restart the scheduler
		reset();
		next();

		//  emit the 'postpone' event
		ultimatum.emit('postpone', ++postpone);
	};

	init();
}

util.inherits(Ultimatum, EventEmitter);

module.exports = Ultimatum;
