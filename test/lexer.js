'use strict';

var Code = require('code'),
	Lab = require('lab'),
	lexer = require('../lib/lexer'),
	lab = exports.lab = Lab.script();

lab.experiment('Lexer', function() {
	lab.experiment('default splitter', function() {
		var parser = lexer({
				//  x, ex, example, examples = 2x input
				'e?x(?:amples?)?': 2,

				//  t, test, tests = 4x input
				't(?:tests?)?': 4
			});

		lab.test('example', function(done) {
			Code.expect(parser('3x')).to.equal(6);
			Code.expect(parser('3 x')).to.equal(6);
			Code.expect(parser('4ex')).to.equal(8);
			Code.expect(parser('4 ex')).to.equal(8);
			Code.expect(parser('5example')).to.equal(10);
			Code.expect(parser('5 example')).to.equal(10);
			Code.expect(parser('6examples')).to.equal(12);
			Code.expect(parser('6 examples')).to.equal(12);

			done();
		});

		lab.test('test', function(done) {
			Code.expect(parser('2t')).to.equal(8);
			Code.expect(parser('2 t')).to.equal(8);
			Code.expect(parser('4test')).to.equal(16);
			Code.expect(parser('4 test')).to.equal(16);
			Code.expect(parser('5tests')).to.equal(20);
			Code.expect(parser('5 tests')).to.equal(20);

			done();
		});

		lab.test('unknown', function(done) {
			Code.expect(parser('3 unknown')).to.equal(0);

			done();
		});
	});

	lab.experiment('custom splitter', function() {
		var parser = lexer({
				//  any character (don't forget we split on vowels) = 1x input
				'[a-z]+': 1
			}, /[aeiou]+/);

		lab.test('u3bae7qi', function(done) {
			Code.expect(parser('3b')).to.equal(3);
			Code.expect(parser('u3b')).to.equal(3);
			Code.expect(parser('3bae')).to.equal(3);
			Code.expect(parser('u3bae')).to.equal(3);
			Code.expect(parser('7q')).to.equal(7);
			Code.expect(parser('ae7q')).to.equal(7);
			Code.expect(parser('7qi')).to.equal(7);
			Code.expect(parser('ae7qi')).to.equal(7);
			Code.expect(parser('3bae7qi')).to.equal(10);
			Code.expect(parser('u3bae7q')).to.equal(10);
			Code.expect(parser('u3bae7qi')).to.equal(10);

			done();
		});
	});
});
