/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

window.Perf = require('react-dom/lib/ReactPerf');

require('./style.styl');
require('leaflet/dist/leaflet.css');

const root = document.createElement('main');
document.body.appendChild(root);
ReactDOM.render(React.createElement(App), root);
