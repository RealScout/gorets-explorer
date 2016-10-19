import React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import ReactDOM from 'react-dom';
import App from 'components/App';
import Home from 'components/containers/Home';
import Connections from 'components/containers/Connections';
import Explorer from 'components/containers/Explorer';
import NotFound from 'components/containers/NotFound';

import 'styles/app.css';

ReactDOM.render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Home} />
      <Route path="connections" component={Connections} />
      <Route path="explorer" component={Explorer} />
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
  ), document.getElementById('app')
);
