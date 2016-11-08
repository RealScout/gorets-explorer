import React from 'react';
import { Link } from 'react-router';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ConnectionService from 'services/ConnectionService';
import Autocomplete from 'react-autocomplete';
import Connections from 'components/containers/Connections';
import Server from 'components/containers/Server';

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
        </nav>
        <Tabs>
          <TabList>
            <Tab>New Connection</Tab>
            {this.state.activeConnections.map(connection =>
              <Tab>{connection.id}</Tab>
            )}
          </TabList>
          <TabPanel><Connections /></TabPanel>
          {this.state.activeConnections.map(connection =>
            <TabPanel><Server connection={connection} /></TabPanel>
          )}
        </Tabs>
      </div>
    );
  }
}
