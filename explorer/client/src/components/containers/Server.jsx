import React from 'react';
import { withRouter } from 'react-router';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Metadata from 'components/containers/Metadata';
import Search from 'components/containers/Search';
import Objects from 'components/containers/Objects';
import StorageCache from 'util/StorageCache';
import MetadataService from 'services/MetadataService';

class Server extends React.Component {

  static propTypes = {
    params: React.PropTypes.any,
    location: React.PropTypes.any,
    router: React.PropTypes.any,
    connection: React.PropTypes.any,
    metadata: React.PropTypes.any,
  }

  static emptyMetadata = {
    System: {
      'METADATA-RESOURCE': {
        Resource: [],
      },
      SystemDescription: 'No Metadata Loaded',
      SystemID: 'N/A',
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      connection: props.connection,
      metadata: Metadata.emptyMetadata,
    };
    this.getMetadata = this.getMetadata.bind(this);
  }

  componentWillMount() {
    this.getMetadata(m => {
      console.log('setting ', m);
      this.setState({ metadata: m });
    });
  }

  getMetadata(onFound) {
    const ck = `${this.state.connection.id}-metadata`;
    const md = StorageCache.getFromCache(ck);
    if (md) {
      console.log('loaded metadata from local cache', md);
      onFound(md);
      return;
    }
    console.log('no metadata cached');
    MetadataService
      .get(this.state.connection.id)
      .then(response => response.json())
      .then(json => {
        if (json.error !== null) {
          return;
        }
        console.log('metadata pulled via json request');
        onFound(json.result.Metadata);
        StorageCache.putInCache(ck, json.result.Metadata, 60);
      });
  }

  render() {
    return (
      <Tabs>
        <TabList>
          <Tab>Metadata</Tab>
          <Tab>Search</Tab>
          <Tab>Objects</Tab>
        </TabList>
        <TabPanel><Metadata connection={this.state.connection} metadata={this.state.metadata} /></TabPanel>
        <TabPanel><Search connection={this.state.connection} metadata={this.state.metadata} /></TabPanel>
        <TabPanel><Objects connection={this.state.connection} metadata={this.state.metadata} /></TabPanel>
      </Tabs>
    );
  }
}

export default withRouter(Server);
