'use strict';

var Code = require('code'),
	Lab = require('lab'),
	Ultimatum = require('../lib/ultimatum'),
	lab = exports.lab = Lab.script();

lab.experiment('Ultimatum', function() {

	lab.test('Desired timeout', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(99);
			Code.expect(Date.now() - start).to.be.below(115);

			done();
		}, 100, 1000);
	});

	lab.test('Stalled timeout', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(199);
			Code.expect(Date.now() - start).to.be.below(215);

			done();
		}, '100ms', '1s');

		task.stall(100);

	});

	lab.test('Multiple stalling timeout', function(done) {
		var start = Date.now(),
			stalled = 0,
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(199);
			Code.expect(Date.now() - start).to.be.below(315);
			Code.expect(stalled).to.equal(2);

			done();
		}, 100, new Date(Date.now() + 1000));

		task.on('stall', function(summary) {
			stalled = summary.stalled;

			if (summary.stalled < 2) {
				setTimeout(function() {
					task.stall();
				}, 100);
			}

			summary.accept();
		});

		task.stall(100);

	});

	lab.test('Stalling beyond the deadline will not pass the deadline', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(999);
			Code.expect(Date.now() - start).to.be.below(1015);

			done();
		}, 100, 1000);

		task.stall(2000);

	});

	lab.test('Rejecting a stall request', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(99);
			Code.expect(Date.now() - start).to.be.below(115);

			done();
		}, 100, 1000);

		task.on('stall', function(summary) {
			summary.reject();
		});

		task.stall();

	});


	lab.test('Terminating an ultimate through a stall request', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.below(15);

			done();
		}, 100, 1000);

		task.on('stall', function(summary) {
			summary.reject(true);
		});

		task.stall();

	});

	lab.test('Stall requests without listeners are honered', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(999);
			Code.expect(Date.now() - start).to.be.below(1015);

			done();
		}, 100, 1000);

		task.stall(2000);
		task.stall();

	});

	lab.test('Stall requests after execution have no effect', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
		}, 100, 200);

		task.on('execute', function(summary) {
			task.stall();

			Code.expect(Date.now() - start).to.be.above(99);
			Code.expect(Date.now() - start).to.be.below(115);

			done();
		});

	});

	lab.test('Accepting stall requests after execution have no effect', function(done) {
		var start = Date.now(),
			count = 0,
			staller, task, timer;

		task = new Ultimatum(function() {
		}, 100, 200);

		task.on('stall', function(summary) {
			staller = summary;
		});

		task.on('execute', function(summary) {
			++count;
			staller.accept();

			clearTimeout(timer);
			timer = setTimeout(function() {
				Code.expect(count).to.equal(1);

				done();
			}, 500);
		});

		task.stall();

	});

	lab.test('Repeating ultimatums', function(done) {
		var start = Date.now(),
			count = 0,
			task, timer, end;

		task = new Ultimatum(function() {
		}, 100, 1000, 2);

		task.on('execute', function(summary) {
			end = Date.now();
			++count;

			clearTimeout(timer);
			timer = setTimeout(function() {
				Code.expect(count).to.equal(2);
				Code.expect(end - start).to.be.above(199);
				Code.expect(end - start).to.be.below(215);

				done();
			}, 1000);
		});

	});

	lab.experiment('Stall requests', function(){
		lab.test('no explicit interval', function(done) {
			var start = Date.now(),
				task;

			task = new Ultimatum(function() {
				Code.expect(Date.now() - start).to.be.above(199);
				Code.expect(Date.now() - start).to.be.below(215);

				done();
			}, 100, 1000);

			task.stall();
		});

		lab.test('explicit interval', function(done) {
			var start = Date.now(),
				task;

			task = new Ultimatum(function() {
				Code.expect(Date.now() - start).to.be.above(149);
				Code.expect(Date.now() - start).to.be.below(165);

				done();
			}, 100, 1000, 0, 50);

			task.stall();
		});

		lab.test('multiple accept/reject only affect the first', function(done) {
			var start = Date.now(),
				task;

			task = new Ultimatum(function() {
				Code.expect(Date.now() - start).to.be.above(149);
				Code.expect(Date.now() - start).to.be.below(165);

				done();
			}, 100, 1000, 0, 50);

			task.on('stall', function(stall) {
				stall.accept();
				stall.accept();
				stall.reject();
			});

			task.stall();
		});
	});

	lab.test('Undefined `repeat` + numeric `interval`, runs until cancel', function(done) {
		var count = 0,
			ended = false,
			task;

		task = new Ultimatum(function() {
			if (ended) {
				throw new Error('running after cancel');
			}

			++count;
		}, 100, 1000, undefined, 50);

		setTimeout(function() {
			ended = true;
			task.cancel();

			setTimeout(function() {
				done();
			}, 200);
		}, 550);
	});
});
