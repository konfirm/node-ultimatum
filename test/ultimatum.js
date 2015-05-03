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
			Code.expect(Date.now() - start).to.be.below(110);

			done();
		}, 100, 1000);
	});

	lab.test('Stalled timeout', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(110);
			Code.expect(Date.now() - start).to.be.below(210);

			done();
		}, '100ms', '1s');

		task.stall(100);

	});

	lab.test('Multiple stalling timeout', function(done) {
		var start = Date.now(),
			stalled = 0,
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(200);
			Code.expect(Date.now() - start).to.be.below(310);
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
			Code.expect(Date.now() - start).to.be.above(900);
			Code.expect(Date.now() - start).to.be.below(1010);

			done();
		}, 100, 1000);

		task.stall(2000);

	});

	lab.test('Rejecting a stall request', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.above(100);
			Code.expect(Date.now() - start).to.be.below(110);

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
			Code.expect(Date.now() - start).to.be.below(10);

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
			Code.expect(Date.now() - start).to.be.above(1000);
			Code.expect(Date.now() - start).to.be.below(1010);

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

			Code.expect(Date.now() - start).to.be.above(100);
			Code.expect(Date.now() - start).to.be.below(110);

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

});
