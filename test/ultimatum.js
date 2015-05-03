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
			Code.expect(Date.now() - start).to.be.above(210);
			Code.expect(Date.now() - start).to.be.below(310);
			Code.expect(stalled).to.equal(2);

			done();
		}, 100, 1000);

		task.on('stall', function(summary) {
			stalled = summary.stalled;

			if (summary.stalled < 2) {
				setTimeout(function() {
					task.stall(100);
				}, 100);
			}
		});

		task.stall(100);

	});

	lab.test('Stalling beyond the deadline is nope', function(done) {
		var start = Date.now(),
			task;

		task = new Ultimatum(function() {
			Code.expect(Date.now() - start).to.be.below(1010);

			done();
		}, 100, 1000);

		task.stall(2000);

	});

});
