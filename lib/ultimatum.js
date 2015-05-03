'use strict';

var EventEmitter = require('events').EventEmitter,
	util = require('util');

/*
	new Ultimatum(
		task: function callback,
		schedule: string timeout as descriptive string, int timeout in milliseconds, date
		deadline: string timeout as descriptive string, int timeout in milliseconds, date
		repeat: number repeat the Ultimatum (default: if interval is undefined - Infinity, 0 otherwise)
		interval: delay in ms used when `stall` is called
	);
*/
function Ultimatum(task, soft, hard, repeat, interval) {
	var ultimatum = this,
		postpone = 0,
		executed = false,
		delay = 0,
		start, timeParser, desire, expire;

	function init() {
		//  Initialize the super_ to all inheritance is taken care of
		Ultimatum.super_.apply(ultimatum, []);

		repeat   = typeof repeat !== 'undefined' ? +repeat : (typeof interval === 'undefined' ? 0 : Infinity);
		interval = typeof interval !== 'undefined' ? +interval : toTime(soft);

		reset();
		schedule();
	}

	function schedule(move) {
		var deadline = toTime(hard);
		clear();

		if (deadline > 0) {
			delay += move || 0;
			desire = setTimeout(onDesire, (start + delay + toTime(soft)) - Date.now());

			if (!move) {
				expire = setTimeout(onDeadline, deadline);
			}
		}
	}

	function onDesire() {
		summary('desire');
		execute();
	}

	function onDeadline() {
		summary('expire');
		execute();
	}

	function clear(expiration) {
		//  prevent any desired intervals to run
		clearTimeout(desire);

		if (expiration) {
			//  prevent the ultimate expiration from running
			clearTimeout(expire);
		}
	}

	function reset() {
		clear(true);

		start    = Date.now();
		postpone = 0;
		delay    = 0;
		executed = false;
	}

	function execute(terminate) {
		var message;

		clear(true);

		if (!executed) {
			executed = true;

			message = summary('execute');
			task.apply(null, [message.duration]);

			//  reschedule if necessary (and not terminated)
			if (!terminate && --repeat > 0) {
				reset();
				schedule();
			}
		}
	}

	function summary(type, addReject) {
		var now = Date.now(),
			result = {
				stalled: postpone,
				duration: Date.now() - start,
				expire: {
					soft: (start + delay + toTime(soft)) - now,
					hard: (start + toTime(hard)) - now
				}
			};

		if (addReject) {
			result.reject = function(terminate) {
				execute(terminate);
			};
		}

		ultimatum.emit(type, result);

		return result;
	}

	function toTime(mixed) {
		if (mixed instanceof Date) {
			mixed = mixed.getTime() - Date.now();
		}
		else if (typeof mixed === 'string') {
			mixed = parseTimeFormat(mixed);
		}

		return +mixed;
	}

	function parseTimeFormat(format) {
		var multiplier;

		if (!timeParser) {
			multiplier = 1;
			timeParser = lexer({
				//  µ, micro, µs, micros, µsec, microsec, µsecond, microsecond, µseconds, microseconds = 1x µs
				//'(?:µ|micro)(?:s(?:ec(?:onds?)?))?': multiplier,

				//  ms, msec, millis, millisec, msecond, millisecond, mseconds, milliseconds = 1000x µs
				//'m(?:illi)?s(?:ec(?:onds?)?)?': multiplier *= 1e3,

				//  ms, msec, millis, millisec, msecond, millisecond, mseconds, milliseconds = 1x ms
				'm(?:illi)?s(?:ec(?:onds?)?)?': multiplier,

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

		return timeParser(format);
	}

	/**
	 *  Create a simple (crude) lexical parser for 'Number word'-patterns based on pattern/multiplier pairs
	 *  @name    lexer
	 *  @access  internal
	 *  @param   Object  config   [{string pattern1: number multiplier1, ...}]
	 *  @return  function lexical parser
	 */
	function lexer(config, splitter) {
		var applier = [false],
			pattern = new RegExp('^' + Object.keys(config).map(function(key) {
				applier.push(function(value) {
					return +value * config[key];
				});

				return '([0-9]+(?:\\.[0-9]+)?)\\s*(?=' + key + ')';
			}).join('|'));

		return function(input) {
			return input.split(/\s*(?:\sand|,)\s*/).reduce(function(prev, cur) {
				return prev + cur.match(pattern).reduce(function(p, c, i) {
					return p || (c && applier[i] ? applier[i](c) : 0);
				}, 0);
			}, 0);
		};
	}

	ultimatum.stall = function(ms) {
		//  we always reschedule if the execution did not take place yet
		if (!executed) {
			schedule(ms || interval);

			++postpone;
			summary('stall', true);
		}
	};

	init();
}

util.inherits(Ultimatum, EventEmitter);

module.exports = Ultimatum;
