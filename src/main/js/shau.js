'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

import App from './app';

/**
 * Main entry point
 */

(function() {
	ReactDOM.render(
		<App />,
		document.getElementById('react')    
	);
})();
