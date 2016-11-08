import React from 'react';
import { withRouter } from 'react-router';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Metadata from 'components/containers/Metadata';
import Search from 'components/containers/Search';
import Objects from 'components/containers/Objects';

class Server extends React.Component {

  static propTypes = {
    params: React.PropTypes.any,
    location: React.PropTypes.any,
    router: React.PropTypes.any,
    connection: React.PropTypes.any,
    setSelectedConnection: React.PropTypes.func.isRequired,
  }

  static defaultProps = {
    connection: { id: null },
  }

  constructor(props) {
    super(props);
    this.connection = props.connection;
    this.state = {};
  }

  render() {
    return (
      <Tabs>
        <TabList>
          <Tab>Metadata</Tab>
          <Tab>Search</Tab>
          <Tab>Objects</Tab>
        </TabList>
        <TabPanel><Metadata connection={this.connection} /></TabPanel>
        <TabPanel><Search connection={this.connection} /></TabPanel>
        <TabPanel><Objects connection={this.connection} /></TabPanel>
      </Tabs>
    );
  }
}

export default withRouter(Server);
