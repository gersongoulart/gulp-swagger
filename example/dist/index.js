'use strict';

import API from 'dist/api';

// Only exposing it for playtime at the console.
window.API = API;

// Playtime
console = console || {};
console.clear();
Object.keys(API).reduce(function (previous, current) {
	previous.push('API.' + current + '();');
	return previous;
}, [
	'╔═╗┬ ┬┬  ┌─┐   ╔═╗┬ ┬┌─┐┌─┐┌─┐┌─┐┬─┐',
	'║ ╦│ ││  ├─┘───╚═╗│││├─┤│ ┬│ ┬├┤ ├┬┘',
	'╚═╝└─┘┴─┘┴     ╚═╝└┴┘┴ ┴└─┘└─┘└─┘┴└─',
	'Try invoking these available methods:'
]).forEach(function logAPIMethods (method) {
	console.log(method);
});
