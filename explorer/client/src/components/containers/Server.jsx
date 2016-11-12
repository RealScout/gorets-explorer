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
  }

  static emptyMetadata = {
    System: {
      'METADATA-RESOURCE': {
        Resource: [],
      },
      SystemDescription: 'Loading metadata...',
      SystemID: 'Loading...',
    },
  };
  constructor(props) {
    super(props);
    this.state = {
      shared: {
        connection: props.connection,
        metadata: Server.emptyMetadata,
        resource: {},
        class: {},
        fields: [],
        rows: [],
      },
    };
    this.getMetadata = this.getMetadata.bind(this);
    this.onMetadataSelected = this.onMetadataSelected.bind(this);
    this.onMetadataDeselected = this.onMetadataDeselected.bind(this);
    this.onClassSelected = this.onClassSelected.bind(this);
  }

  componentWillMount() {
    this.getMetadata(m => {
      console.log('setting ', m);
      const shared = this.state.shared;
      shared.metadata = m;
      this.setState({ shared });
    });
  }

  onMetadataSelected(rows) {
    const shared = this.state.shared;
    shared.fields = this.state.shared.fields.concat(rows.map(r => r.rowIdx));
    this.setState({ shared });
  }

  onMetadataDeselected(rows) {
    const shared = this.state.shared;
    const rowIndexes = rows.map(r => r.rowIdx);
    shared.fields = this.state.shared.fields.filter(i => rowIndexes.indexOf(i) === -1);
    this.setState({ shared });
  }

  onClassSelected(res, cls) {
    console.log('selected:', res, cls);
    const shared = this.state.shared;
    shared.resource = res;
    shared.class = cls;
    this.setState({ shared });
    this.forceUpdate();
  }

  getMetadata(onFound) {
    const ck = `${this.state.shared.connection.id}-metadata`;
    const md = StorageCache.getFromCache(ck);
    if (md) {
      console.log('loaded metadata from local cache', md);
      onFound(md);
      return;
    }
    console.log('no metadata cached');
    MetadataService
      .get(this.state.shared.connection.id)
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
        <TabPanel>
          <Metadata
            shared={this.state.shared}
            onRowsSelected={this.onMetadataSelected}
            onRowsDeselected={this.onMetadataDeselected}
            onClassSelected={this.onClassSelected}
          />
        </TabPanel>
        <TabPanel><Search shared={this.state.shared} /></TabPanel>
        <TabPanel><Objects shared={this.state.shared} /></TabPanel>
      </Tabs>
    );
  }
}

export default withRouter(Server);
