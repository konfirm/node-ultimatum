'use strict';

/**
 *  Create a simple (crude) lexical parser for 'Number word'-patterns based on pattern/multiplier pairs
 *  @name    lexer
 *  @access  internal
 *  @param   Object  config   [{string pattern1: number multiplier1, ...}]
 *  @param   RegExp  splitter [optional, default undefined - \s*(?:\sand|,)\s*, split on ' and ', ', ']
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
		return input.split(splitter || /\s*(?:\sand|,)\s*/).reduce(function(prev, cur) {
			return prev + (cur.match(pattern) || []).reduce(function(p, c, i) {
				return p || (c && applier[i] ? applier[i](c) : 0);
			}, 0);
		}, 0);
	};
}

//  expose the internal lexer function
module.exports = lexer;
