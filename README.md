[![npm version](https://badge.fury.io/js/ultimatum.svg)](http://badge.fury.io/js/ultimatum)
[![Build Status](https://travis-ci.org/konfirm/node-ultimatum.svg?branch=master)](https://travis-ci.org/konfirm/node-ultimatum)
[![Coverage Status](https://coveralls.io/repos/konfirm/node-ultimatum/badge.svg?branch=master)](https://coveralls.io/r/konfirm/node-ultimatum?branch=master)
[![dependencies](https://david-dm.org/konfirm/node-ultimatum.svg)](https://david-dm.org/konfirm/node-ultimatum#info=dependencies)
[![dev-dependencies](https://david-dm.org/konfirm/node-ultimatum/dev-status.svg)](https://david-dm.org/konfirm/node-ultimatum#info=devDependencies)

# node-ultimatum
Create an Ultimatum, which has a callback, a desired (soft) time(out) and a (hard) deadline. Easily stall tasks if a delay is needed, but the callback is executed whenever the either the soft or hard deadline is reached, whichever comes first.

## Concept
Create an Ultimatum for a callback function, the Ultimatum can then be postponed (optionally to a set threshold limit after which an unconditional execution of the callback takes place). Combine this with a given interval at which the callback should be executed (either once or repeatingly)

## Install
```
npm install --save ultimatum
```

## API

### `Ultimatum(callback, soft, hard [, repeat [, interval]])`
* `callback` is the function to be executed
* `soft` is the 'soft' (desired) time to execute the Ultimatum - this is the value than can be influence using `stall`
* `hard` is the 'hard' (deadline) time to execute the Ultimatum
* `repeat` is the number of times to repeat the Ultimatum [optional, default undefined - 0 (or `Infinity` if `interval` (below) is specified)]
* `interval` is the default interval to use when calling `stall` [optional, default undefined - the value of `soft`]

**Note** that both `soft` and `hard` deadlines allow for various ways to provide a time:
- `int milliseconds` - timeout specified in milliseconds (this is probably the most intuitive for developers, as it is similar to `setTimeout` and `setInterval`)
- `string format` - timeout specified in a human readable fashion, e.g. '1 week, 2 days, 3 hours, 4 minutes, 5 seconds and 6 milliseconds', all options are:
  * milliseconds: `ms`, `millisecond`, `milliseconds` (and as a result of how crude the parser is: `millis`, `msecond`, `mseconds` will also work)
  * seconds (1000x milliseconds): `s`, `second`, `seconds`
  * minutes (60x seconds): `m`, `min`, `minute`, `minutes`
  * hours (60x minutes): `h`, `hour`, `hours`
  * days (24x hours): `d`, `day`, `days`
  * week (7x days): `w`, `week`, `weeks`

#### `Ultimatum.stall([milliseconds])`
Request the Ultimatum to be stalled by `milliseconds` (which defaults to the `interval` determined at construction of the Ultimatum, either explicitly or implicitly (where it is the same as the `soft` deadline interval)), accepting the 'stall' will move (_only_) the 'soft' deadline, if stalling the Ultimatum exceeds the 'hard' deadline, the Ultimatum _will be executed_.
Whenever the `stall` method is called, a 'stall'-event is created, which must be either `accept`- or `reject`-ed. If no listeners for 'stall'-events are configured, it will be automatically be accepted.

#### `Ultimatum.cancel()`
Cancel the Ultimatum, this will shut down and clean up the Ultimatum, causing it to never be executed.

### Events
Nearly every action an Ultimatum does/receives has an event, most are purely informational, except for `stall`-events, which _must_ be handled if they are handled.
All event handlers will receive a single argument containing an object which hold a lot of information about the internal state of the Ultimatum.
The follow structure will always be provided:
```js
{
    type: '<event>',  //  one of: stall, repeat, cancel, desire, expire, execute
    stalled: 0,       //  the number of stall requests
    duration: 1234,   //  the number of milliseconds the Ultimatum is active
    repeat: 0,        //  the number of times the Ultimatum will be repeated after execution
    expiration: {
        soft: 123,    //  the time in milliseconds until the soft deadline ('desire'-event)
        hard: 1234    //  the time in milliseconds until the hard deadline ('expire'-event)
    }
}
```

#### `repeat`-event
The Ultimatum is rescheduled after it expired, this will only happen if the `repeat` parameter was provided during construction

#### `cancel`-event
The Ultimatum is cancelled.

#### `desire`-event
The Ultimatum will execute as the desired (soft) deadline (this does include any accepted `stall`-requests) is reached

#### `expire`-event
The Ultimatum will execute as the (hard) deadline is reached

#### `execute`-event
The Ultimatum is executed

#### `stall`-event
A request to stall the Ultimatum, the argument will be the object described aboved, with the following additions
```js
{
    //  default summary object, plus:
    amount: 123,         //  the number of milliseconds the (soft) deadline should be moved
    accept: function,    //  the function to call if the stall is acceptable
    reject: function     //  the function to call is the stall is not te be accepted, optionally provide `bool true` to execute the Ultimatum immediatly,
                         //  if the boolean value is ommited it is regarded as `false`-ish (reject, but do not terminate the Ultimatum)
}
```


## Usage
### Creating an Ultimatum
```js
var Ultimatum = require('ultimatum'),
	task;

function deadline() {
	console.log('the ultimatum executed');
}

//  create a new Ultimatum, calling `deadline` in (preferably) 100ms, but at most in 1000ms (1 second)
task = new Ultimatum(deadline, 100, 1000);

//  if nothing further, the Ultimatum will now run 100ms after it was created
```

### Stalling
Sometimes it is wanted to stall a little, for example if an important event takes place, in those situations it is necessary to stall the Ultimatum.
```js
var Ultimatum = require('ultimatum'),
	task;

function deadline() {
	console.log('the ultimatum executed');
}

//  create a new Ultimatum, calling `deadline` in (preferably) 100ms, but at most in 1000ms (1 second)
task = new Ultimatum(deadline, 100, 1000);

//  stall the Ultimatum in 50ms
setTimeout(function() {
	task.stall();
}, 50);

//  if nothing further, the Ultimatum will now run 150ms after it was created
```

*note*: The `stall` method accepts an argument indicating the number of milliseconds the Ultimatum should be stalled.

It is possible to attach event handlers to the Ultimatums in order to intercept `stall` events, if an event handler is set, the stall _must_ be explicitly accepted or rejected, otherwise the execution will not take place until the hard deadline is reached.
If there are no handlers configured for `stall` events, they are automatically accepted.
```js
var Ultimatum = require('ultimatum'),
	stalling = 0,
	task, interval;

function deadline() {
	console.log('the ultimatum executed');
}

//  create a new Ultimatum, calling `deadline` in (preferably) 100ms, but at most in 1000ms (1 second)
task = new Ultimatum(deadline, 100, 1000);

//  attach an event handler to accept/reject stall requests
task.on('stall', function(stall) {
	if (++stalling < 5) {
		stall.accept();
	}
	//  else, refuse any further stalling
	else {
		stall.reject();
	}
});

//  stall the Ultimatum in 50ms
interval = setInterval(function() {
	task.stall();
}, 50);

//  stop the interval after 2 seconds, preventing this script from running forever
setTimeout(function() {
	clearInterval(interval);
}, 2000);
//  if nothing further, the Ultimatum will now run 500ms after it was created
```

*note*: you can choose to execute the Ultimatum immediatly within every stall event, the `reject` method provided accept an optional argument, `reject([bool terminate])`. By calling `.reject(true)`, the Ultimatum does not wait for the any soft or hard deadline but execute immediatly (and reschedule if the Ultimatum can be repeated).

## Real-world example
Imagine you are creating an website/api and you wish to show/update statistics regularly but you want to throttle the amount of updates you trigger when there's a lot of traffic, here's a basic example for that scenario.
```js
'use strict';

var http = require('http'),
	Ultimatum = require('ultimatum'),
	counter = 0,
	server, task;

//  this is the 'status' function, logging to the console
function status() {
	console.log('[%s] served %d requests', new Date(), counter);
}

//  create an ultimatum, which runs `status` every 1 second, but at least every 10 seconds if there is heavy traffic
task = new Ultimatum(status, '1s', '10s', Infinity);

http
	.createServer(function(request, response) {
		//  stall the task
		task.stall();
		//  increase the counter
		++counter;

		//  respond
		response.writeHead(200, { 'Content-Type': 'text/plain'});
		response.write('OK');
		response.end();
	})
	.listen(3000)
;
```
This example will 'tick' a console log message every second, unless there is/was traffic, for each request the logging is delayed by 1 second (to at most 10 seconds).


## License
GPLv2 © [Konfirm](https://konfirm.eu)
