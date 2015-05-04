'use strict';

var EventEmitter = require('events').EventEmitter,
	util = require('util');

/**
 *  Create Ultimatums
 *  @package    ultimatum
 *  @copyright  Konfirm ⓒ 2015
 *  @author     Rogier Spieker (rogier+npm@konfirm.eu)
 *  @license    GPLv2
 *  @example    new Ultimatum(
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

	/**
	 *  Initialize the Ultimatum, inheriting from EventEmitter and setting default values
	 *  @name    init
	 *  @access  internal
	 *  @return  void
	 */
	function init() {
		//  Initialize the super_ to all inheritance is taken care of
		Ultimatum.super_.apply(ultimatum, []);

		repeat   = typeof repeat !== 'undefined' ? +repeat : (typeof interval === 'undefined' ? 0 : Infinity);
		interval = typeof interval !== 'undefined' ? +interval : toTime(soft);

		reset();
		schedule();
	}

	/**
	 *  (Re-)Schedule the timeouts
	 *  @name    schedule
	 *  @access  internal
	 *  @param   int move [optional, default undefined - no move but set]
	 *  @return  void
	 */
	function schedule(move) {
		clear();

		if (!executed) {
			delay += move || 0;
			desire = setTimeout(onDesire, (start + delay + toTime(soft)) - Date.now());

			if (typeof move === 'undefined') {
				expire = setTimeout(onDeadline, toTime(hard));
			}
		}
	}

	/**
	 *  Trigger the (soft) expiration
	 *  @name    onDesire
	 *  @access  internal
	 *  @return  void
	 *  @note    triggers: 'desire'-event
	 */
	function onDesire() {
		summary('desire');
		execute();
	}

	/**
	 *  Trigger the (hard) deadline expiration
	 *  @name    onDeadline
	 *  @access  internal
	 *  @return  void
	 *  @note    triggers: 'expire'-event
	 */
	function onDeadline() {
		summary('expire');
		execute();
	}

	/**
	 *  Clear the desired timeout, optionally the expire timeout too
	 *  @name    clear
	 *  @access  internal
	 *  @param   bool     expiration [optional, default undefined - do not clear expiration]
	 *  @return  void
	 */
	function clear(expiration) {
		//  prevent any desired intervals to run
		clearTimeout(desire);

		if (expiration) {
			//  prevent the ultimate expiration from running
			clearTimeout(expire);
		}
	}

	/**
	 *  Restore the internal values
	 *  @name    reset
	 *  @access  internal
	 *  @return  void
	 */
	function reset() {
		clear(true);

		start    = Date.now();
		postpone = 0;
		delay    = 0;
		executed = false;
	}

	/**
	 *  Execute the Ultimatum
	 *  @name    summary
	 *  @access  internal
	 *  @param   bool  terminate [optional, default undefine - do not terminate]
	 *  @return  void
	 *  @note    triggers: 'execute'-event, 'repeat'-event (if applicable)
	 */
	function execute(terminate) {
		var message;

		clear(true);

		executed = true;

		message = summary('execute');
		task.apply(null, [message.duration]);

		//  reschedule if necessary (and not terminated)
		if (!terminate && --repeat > 0) {
			reset();
			schedule();

			summary('repeat');
		}
	}

	/**
	 *  Create the summary object and (optionally) emit the event
	 *  @name    summary
	 *  @access  internal
	 *  @param   string   type
	 *  @param   bool     prevent emit [optional, default undefined - don't prevent]
	 *  @return  Object   summary
	 */
	function summary(type, preventEmit) {
		var now = Date.now(),
			result = {
				type: type,
				stalled: postpone,
				duration: Date.now() - start,
				repeat: repeat,
				expiration: {
					soft: (start + delay + toTime(soft)) - now,
					hard: (start + toTime(hard)) - now,
					delayed: delay
				}
			};

		if (!preventEmit) {
			ultimatum.emit(type, result);
		}

		return result;
	}

	/**
	 *  Return the number of milliseconds until <mixed> happens
	 *  @name    toTime
	 *  @access  internal
	 *  @param   mixed    [one of: int milliseconds, string formatted time, Date date]
	 *  @return  int      milliseconds
	 */
	function toTime(mixed) {
		if (mixed instanceof Date) {
			mixed = mixed.getTime() - Date.now();
		}
		else if (typeof mixed === 'string') {
			mixed = parseTimeFormat(mixed);
		}

		return +mixed;
	}

	/**
	 *  Parse the given string to obtain a time in milliseconds
	 *  @name    parseTimeFormat
	 *  @access  internal
	 *  @param   string   format
	 *  @return  int      milliseconds
	 */
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

	/**
	 *  Request the (soft) deadline to be stalled (accepted implicitly if there are no listeners, accepted/rejected explicitly otherwise)
	 *  @name    stall
	 *  @access  public
	 *  @param   int   milliseconds [optional, default undefined - use the default interval]
	 *  @return  void
	 *  @note    triggers: 'stall'-event
	 */
	ultimatum.stall = function(ms) {
		var handled = false,
			report, amount;

		//  we always reschedule if the execution did not take place yet
		if (!executed) {
			++postpone;

			amount = toTime(ms || interval);

			//  if there are no listeners for the 'stall' event, we always allow the ultimatum to be stalled
			if (ultimatum.listeners('stall') <= 0) {
				return schedule(amount);
			}

			report = summary('stall', true);
			report.amount = amount;
			report.reject = function(terminate) {
				if (!handled && terminate) {
					handled = true;
					execute(terminate);
					return handled;
				}

				return false;
			};

			report.accept = function() {
				if (!handled) {
					handled = true;
					schedule(amount);

					return true;
				}

				return false;
			};

			ultimatum.emit(report.type, report);
		}
	};

	/**
	 *  Cancel the Ultimatum completely, it will not execute nor can it be activated again
	 *  @name    cancel
	 *  @access  public
	 *  @return  void
	 *  @note    triggers: 'cancel'-event
	 */
	ultimatum.cancel = function() {
		clear();

		summary('cancel');
	};

	init();
}

util.inherits(Ultimatum, EventEmitter);

module.exports = Ultimatum;
