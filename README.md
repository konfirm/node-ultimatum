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


## License
GPLv2 © [Konfirm](https://konfirm.eu)
