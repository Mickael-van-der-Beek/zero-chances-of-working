var stringify = require('csv-stringify');
var request = require('request');
var async = require('async');
var fs = require('fs');

var domain = 'http://www.tirage-euromillions.net';

var MAX_NUMBER = 50;
var NUMBERS_PER_DRAW = 5;
var years = [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014];

function getUri (year) {
	if(year === 2014) {
		return 'resultats-euromillions/tirages-euromillions-annee-';
	}
	else if(year < 2008) {
		return 'resultats-euromillions/tirages-';
	}
	return 'resultats-euromillions/tirages-euromillions-de-lannee-';
}

function textToFile (textMatrix) {
	fs.writeFile('./numbers.csv', textMatrix, function (e) {
		if(e) {
			return console.log(e);
		}
	});
}

function matrixToFile (matrix) {
	stringify(matrix, function (e, textMatrix) {
		if(e) {
			return console.log(e);
		}

		textToFile(textMatrix);
	});
}

function getCoOccurrence (draw, matrix) {
	var numberTwo;
	var numberOne;
	var k;
	for(var i = 0, len = draw.length; i < len; i++) {
		numberOne = draw[i];
		if(!(numberOne in matrix)) {
			matrix[numberOne] = new Array(MAX_NUMBER);
			matrix[numberOne][numberOne] = 0;
		}
		for(k = 0; k < len; k++) {
			if(k === i) {
				continue;
			}
			numberTwo = draw[k];
			if(!(numberTwo in matrix[numberOne])) {
				matrix[numberOne][numberTwo] = 0;
			}
			matrix[numberOne][numberTwo] += 1;
		}
	}
}

function getNumberMatrix (numbers) {
	var matrix = [];
	var draw;
	for(var i = 0, len = numbers.length; i < len; i += NUMBERS_PER_DRAW) {
		draw = numbers.slice(i, i + NUMBERS_PER_DRAW);
		console.log(draw);
		getCoOccurrence(draw, matrix);
	}

	return matrix;
}

function getWinningNumbers (html) {
	var numbers = html.match(/<div\sclass\=\"game\_point\">[0-9]+<\/div>/gim);
	return numbers.map(function (number) {
		return number.replace(/[^0-9]/g, '');
	});
}

function getWinningStars (html) {
	var stars = html.match(/<div\sclass\=\"star\_small\">[0-9]+<\/div>/gim);
	return stars.map(function (star) {
		return star.replace(/[^0-9]/g, '');
	});
}

function parseHtml (html) {
	//var numbers = getWinningNumbers(html);
	//var stars = getWinningStars(html);
	return getWinningNumbers(html);
}

var numbers = [];
async.each(years, function (year, callback) {
	var url = domain + '/' + getUri(year) + year;
	request(url, function (e, res, html) {
		if(e || res.statusCode !== 200) {
			return callback(new Error(e || 'Response(' + res.statusCode + ') : ' + url));
		}

		numbers = numbers.concat(parseHtml(html) || []);
		callback();
	});
}, function (e) {
	if(e) {
		return console.log(e);
	}

	var numberMatrix = getNumberMatrix(numbers);
	matrixToFile(numberMatrix);
});
