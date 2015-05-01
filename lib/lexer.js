'use strict';

function lexer(config) {
	var applier = [false],
		pattern = new RegExp('^' + Object.keys(config).map(function(key) {
			applier.push(function(value) {
				return +value * config[key];
			});

			return '([0-9]+(?:\\.[0-9]+)?)\\s*(?=' + key + ')';
		}).join('|'));

	return function(input) {
		return input.split(/\s*(?:\sand|,)\s*/).reduce(function(prev, cur) {
			return prev + (cur.match(pattern) || []).reduce(function(p, c, i) {
				return p || (c && applier[i] ? applier[i](c) : 0);
			}, 0);
		}, 0);
	};
}

module.exports = lexer;
