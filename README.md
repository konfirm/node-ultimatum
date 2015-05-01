# Ultimatum
Timing management, simplified. Create timeouts, intervals, schedule tasks, postpone timeouts/intervals, respond to events

## Concept
Create an Ultimatum for a callback function, the Ultimatum can then be postponed (optionally to a set threshold limit after which an unconditional execution of the callback takes place). Combine this with a given interval at which the callback should be executed (either once or repeatingly)

## Install
```
npm install --save ultimatum
```

## Usage
```js
var Ultimatum = require('ultimatum'),
	myUltimatum = new Ultimatum();

function myCallback(error, event) {
	if (error) {
		throw error;
	}

	console.log(event);
	/*
		{
			type: 'timeout',
			start: timestamp,
			overdue: 100µs
		}
	*/
}

myUltimatum.start({
	timeout: 1000,
	interval: '5 minutes',
	postpone: 5,
	callback: myCallback
});
```

## API
```js
var Ultimatum = require('ultimatum');
	myUltimatum = new Ultimatum({
		//  affected by pause, reset
		interval: '5 minutes',  //  trigger every 5 minutes, default undefined - no interval
		timeout: 1000,          //  trigger in 1000ms, default undefined - no timeout
		//  affected by reset
		postpone: 5,            //  trigger when postponed 5 times, default undefined - no enforced triggers
								//  also resets and moves forward any timeout and resets interval
		until: '1 hour',        //  stop after 1 hour of operation, default Infinity - never stop
	});
```
