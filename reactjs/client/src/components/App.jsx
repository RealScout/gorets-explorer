import React from 'react';
import { Link } from 'react-router';
import ConnectionService from 'services/ConnectionService';
import Autocomplete from 'react-autocomplete';

export default class App extends React.Component {

  static propTypes = {
    children: React.PropTypes.any,
    params: React.PropTypes.any,
  }

  constructor(props) {
    super(props);
    this.state = {
      connections: [],
      activeConnections: [],
      selectedConnection: {},
      connectionAutocompleteField: '',
    };
    this.establishConnection = this.establishConnection.bind(this);
    this.setSelectedConnection = this.setSelectedConnection.bind(this);
  }

  componentDidMount() {
    if (this.props.params.connection) {
      this.setSelectedConnection({
        id: this.props.params.connection,
      });
    }
    ConnectionService
      .getConnectionList()
      .then(res => res.json())
      .then((json) => {
        this.setState({ connections: json.result.connections });
      });
    ConnectionService
      .getActiveConnectionList()
      .then(res => res.json())
      .then((json) => {
        this.setState({ activeConnections: json.result.connections || [] });
      });
  }

  setSelectedConnection(connection) {
    if (typeof connection === 'string') {
      this.setState({ selectedConnection: { id: connection } });
      return;
    }
    this.setState({ selectedConnection: connection });
  }

  establishConnection(connection) {
    ConnectionService
      .login(connection)
      .then(res => res.json())
      .then(() => {
        ConnectionService
          .getActiveConnectionList()
          .then(res => res.json())
          .then((activeConnections) => {
            this.setState({ activeConnections: activeConnections.result.connections || [] });
          });
      });
  }

  render() {
    let { children } = this.props;
    // if (children.props.connection) {
    children = React.cloneElement(children, {
      connection: this.state.selectedConnection,
      setSelectedConnection: this.setSelectedConnection,
    });
    // }
    return (
      <div className="helvetica">
        <nav className="pa3 bg-black">
          <Link
            to="/"
            title="Home"
            className="link fw2 red b f4 dib mr3"
          >
            RETS Explorer
          </Link>
          <Link
            to="/connections"
            title="Connections"
            activeStyle={{ color: 'white' }}
            className="link red f6 dib mr3"
          >
            Connections
          </Link>
          <Link
            to="/metadata"
            title="Metadata"
            activeStyle={{ color: 'white' }}
            className="link red f6 dib mr3"
          >
            Metadata
          </Link>
          <Link
            to="/search"
            title="Search"
            activeStyle={{ color: 'white' }}
            className="link red f6 dib mr3"
          >
            Search
          </Link>
          <Link
            to="/objects"
            title="Objects"
            activeStyle={{ color: 'white' }}
            className="link red f6 dib mr3"
          >
            Objects
          </Link>
        </nav>
        <div className="pv2 pl3 bb v-mid flex flex-row align-center overflow-x-scroll">
          <span className="f6 mr3">Active Connection:
            <span className="b"> {this.state.selectedConnection.id}</span>
          </span>
          <Autocomplete
            value={this.state.connectionAutocompleteField}
            inputProps={{
              placeholder: 'Available connections',
              name: 'connections autocomplete',
              id: 'connections-autocomplete',
            }}
            items={this.state.connections}
            shouldItemRender={(item, value) =>
              (item.id.toLowerCase().indexOf(value.toLowerCase()) !== -1)
            }
            onChange={(event, value) => this.setState({ connectionAutocompleteField: value })}
            onSelect={(value, connection) => {
              console.log('selected', value);
              this.setState({ connectionAutocompleteField: value });
              this.setState({ selectedConnection: connection });
              this.establishConnection(connection);
            }}
            sortItems={(a, b) => (a.id.toLowerCase() <= b.id.toLowerCase() ? -1 : 1)}
            getItemValue={(item) => item.id}
            renderItem={(item, isHighlighted) => (
              <div
                style={isHighlighted ? { backgroundColor: '#e8e8e8' } : { backgroundColor: 'white' }}
                key={item.id}
              >
                {item.id}
              </div>
            )}
          />
          {this.state.activeConnections.map(connection =>
            <Link
              to={`/metadata/${connection.id}`}
              onClick={() => this.setState({ selectedConnection: connection })}
              title={connection.id}
              className="link f6 dib ml2"
            >
              {connection.id}
            </Link>
          )}
        </div>
        {children}
      </div>
    );
  }
}
