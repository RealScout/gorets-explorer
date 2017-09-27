import React from 'react';
import MetadataService from 'services/MetadataService';
import StorageCache from 'util/StorageCache';
import { Fieldset, Field, createValue, Input } from 'react-forms';
import { withRouter } from 'react-router';
import ReactDataGrid from 'react-data-grid';

const ReactDataGridPlugins = require('react-data-grid/addons');

const Toolbar = ReactDataGridPlugins.Toolbar;

class Metadata extends React.Component {

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
    const searchForm = createValue({
      value: {
        query: '(TIMESTAMP=2016-11-01T00:00:00+)',
      },
      onChange: this.searchInputsChange.bind(this),
    });
    this.state = {
      metadata: Metadata.emptyMetadata,
      selectedClass: null,
      defaultRows: [],
      lookupValues: [],
      selectedClassRows: [],
      selectedFieldSet: [],
      filters: {},
      searchForm,
    };
    this.handleGridSort = this.handleGridSort.bind(this);
    this.onCellSelected = this.onCellSelected.bind(this);
    this.submitSearchForm = this.submitSearchForm.bind(this);
  }

  componentDidMount() {
    if (this.props.params.connection) {
      this.getMetadata(this.props.params.connection);
    }
  }

  componentWillReceiveProps(nextProps) {
    // if no connection is inbound
    if (!nextProps.params.connection) {
      console.log('wiping metadata');
      this.setState({ metadata: Metadata.emptyMetadata });
      return;
    }
    // if this is a new connection
    if (nextProps.params !== this.props.params) {
      this.props.setSelectedConnection(nextProps.params.connection);
      this.getMetadata(nextProps.params.connection);
    }
  }

  onClearFilters = () => {
    this.setState({ filters: {} });
  }

  onCellSelected(coordinates) {
    const row = this.state.selectedClassRows[coordinates.rowIdx];
    const selectedKey = 'SystemName';
    const selectedVal = row[selectedKey];
    const { searchForm } = this.state;
    if (searchForm.value === null) {
      searchForm.value = {};
    }

    let newLookupValues = [];

    if (row['Interpretation'] && row['Interpretation'].indexOf('Lookup') === 0) {
      const selectedResource = this.state.selectedClass['METADATA-TABLE']['Resource'];
      const lookupName = row['LookupName'];
      const resource = this.state.metadata['System']['METADATA-RESOURCE']['Resource'].find( (res) => {
        return res['ResourceID'] === selectedResource;
      });
      const lookups = resource['METADATA-LOOKUP']['Lookup'].find( (lookup) => {
        return lookup['LookupName'] === lookupName;
      });
      newLookupValues = lookups['METADATA-LOOKUP_TYPE']['LookupType'];
    }
    let currentSearchVal = searchForm.value['select'] || '';
    if (currentSearchVal !== '') {
      currentSearchVal = `${currentSearchVal},`;
    }

      const newSelect = `${currentSearchVal}${selectedVal}`;
      searchForm.value['select'] = Array.from(new Set(newSelect.split(','))).join(',');
    this.setState({
        searchForm: searchForm,
        lookupValues: newLookupValues
    });
  }

  getMetadata(connectionId) {
    this.setState({
      selectedClass: null,
      defaultRows: [],
      selectedClassRows: [],
      metadata: Metadata.emptyMetadata,
    });
    const ck = `${connectionId}-metadata`;
    const md = StorageCache.getFromCache(ck);
    if (md) {
      console.log('loaded metadata from local cache', md);
      this.setState({ metadata: md });
      return;
    }
    console.log('no metadata cached');
    MetadataService
      .get(connectionId)
      .then(response => response.json())
      .then(json => {
        if (json.error !== null) {
          return;
        }
        console.log('json request:', json.result.Metadata);
        this.setState({ metadata: json.result.Metadata });
        // this.setState({ metadata: md });
        StorageCache.putInCache(ck, json.result.Metadata, 60);
      });
  }

  searchInputsChange(searchForm) {
    this.setState({ searchForm });
  }

  metadataClassClick(selectedClass) {
    const defaultRows = selectedClass['METADATA-TABLE'].Field;
    const selectedClassRows = selectedClass['METADATA-TABLE'].Field;
    const selectedFieldSet = [];
    defaultRows.forEach(field => {
      Object.keys(field).forEach(key => {
        if (selectedFieldSet.includes(key)) {
          return;
        }
        selectedFieldSet.push(key);
      });
    });
    this.setState({
      selectedClass,
      defaultRows,
      selectedClassRows,
      selectedFieldSet,
    });
  }

  handleGridSort(sortColumn, sortDirection) {
    const comparer = (a, b) => {
      const aVal = a[sortColumn] ? String(a[sortColumn]).toLowerCase() : '';
      const bVal = b[sortColumn] ? String(b[sortColumn]).toLowerCase() : '';
      if (sortDirection === 'ASC') {
        return (aVal > bVal) ? 1 : -1;
      } else if (sortDirection === 'DESC') {
        return (aVal < bVal) ? 1 : -1;
      }
      return null;
    };
    const rows = sortDirection === 'NONE'
      ? this.state.selectedClassRows
      : this.state.selectedClassRows.sort(comparer);
    this.setState({ selectedClassRows: rows });
  }

  handleFilterChange = (filter) => {
    const newFilters = Object.assign({}, this.state.filters);
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }
    this.setState({ filters: newFilters });
    const rows = this.state.defaultRows;
    const newRows = [...rows];
    Object.keys(newFilters).forEach(newFilter => {
      const filterObj = newFilters[newFilter];
      if (filterObj.filterTerm) {
        console.log(filterObj.filterTerm);
        console.log('rowLen: ', rows.length);
        for (let i = rows.length - 1; i >= 0; i--) {
          const row = rows[i];
          const val = row[filterObj.column.key] || '';
          const stringVal = String(val).toLowerCase();
          if (stringVal.indexOf(filterObj.filterTerm.toLowerCase()) === -1) {
            newRows.splice(i, 1);
          }
        }
      }
    });
    if (newRows.length > 0) {
      this.setState({ selectedClassRows: newRows });
    }
  }

  submitSearchForm() {
    this.props.router.push({
      ...this.props.location,
      pathname: '/search',
      query: Object.assign({}, {
        ...this.state.searchForm.value,
        id: this.props.connection.id,
        resource: this.state.selectedClass['METADATA-TABLE'].Resource,
        class: this.state.selectedClass.ClassName,
      }),
    });
  }

  renderSelectedClassDescription(clazz) {
    return (
      <span title={clazz.Description}>
        {clazz.ClassName} - <span className="f6 moon-gray">{clazz.Description}</span>
      </span>
    );
  }

  renderLookupValues() {
    const columns = [
        { key: 'Value', name: 'Value' },
        { key: 'ShortValue', name: 'Short Value' },
        { key: 'LongValue', name: 'Long Value' },
    ];

    const rows = this.state.lookupValues.map( (lookupEntry) => {
        return {
            LongValue: lookupEntry['LongValue'],
            ShortValue: lookupEntry['ShortValue'],
            Value: lookupEntry['Value']
        }
    });

    const rowGetter = (i) => {
        return rows[i];
    };

    let selectedFields = this.state.searchForm.value.select;
    if (rows.length && selectedFields) {
       selectedFields = selectedFields.split(',');
        return (
            <div>
                <h3>Lookup Values for {selectedFields[selectedFields.length - 1]}</h3>
                <ReactDataGrid
                    columns={columns}
                    rowGetter={rowGetter}
                    rowsCount={rows.length}
                    minHeight={500}
                />
            </div>
        );
    }

  }

  render() {
    const { selectedClassRows, selectedClass } = this.state;
    let tableBody, lookupBody;
      const columnsToFilter = ['MetadataEntryID', 'Searchable', 'DBName', 'ShortName', 'Alignment', 'UseSeparator',
          'EditMaskID', 'Default', 'Unique', 'ModTimeStamp', 'InKeyIndex', 'Precision', 'MaxSelect', 'MaximumLength'];
    if (selectedClassRows) {
      const availableFields = this.state.selectedFieldSet;
      const fieldSet = ((selectedClassRows && selectedClassRows.length > 0)
        ? availableFields.map((name) => {
              return {
                  key: name,
                  name,
                  resizable: true,
                  width: 200,
                  sortable: true,
                  filterable: true,
              }
          })
        : []).filter( (field) => {
            return columnsToFilter.indexOf(field.key) === -1
      });
      const rowGetter = (i) => selectedClassRows[i];
      tableBody = (
        <div>
          {selectedClass
            ? (
              <span>
                <span className="b">{selectedClass['METADATA-TABLE'].Resource} </span>
                {this.renderSelectedClassDescription(selectedClass)}
              </span>
            )
            : null
          }
          <ReactDataGrid
            onGridSort={this.handleGridSort}
            columns={fieldSet}
            rowGetter={rowGetter}
            rowsCount={selectedClassRows.length}
            toolbar={<Toolbar enableFilter />}
            onAddFilter={this.handleFilterChange}
            onClearFilters={this.onClearFilters}
            onCellSelected={this.onCellSelected}
          />
        </div>
      );
      lookupBody = this.renderLookupValues();
    } else {
      tableBody = null;
      lookupBody = null;
    }
    return (
      <div>
        <div className="fl h-100-ns w-100 w-20-ns no-list-style pa3 overflow-x-scroll nowrap">
          <h1 className="f5" title={this.state.metadata.System.SystemDescription}>
            {this.state.metadata.System.SystemID}
          </h1>
          <ul className="pa0 ma0">
            {this.state.metadata.System['METADATA-RESOURCE'].Resource.map((r) =>
              <li className="mb2">
                <div title={r.Description} className="b">{r.ResourceID}</div>
                <ul className="pa0 pl3 mv1">
                  {r['METADATA-CLASS'].Class.map((mClass) =>
                    <li
                      onClick={() => this.metadataClassClick(mClass)}
                      className="clickable metadata-class-name"
                    >
                      {this.renderSelectedClassDescription(mClass)}
                    </li>
                  )}
                </ul>
              </li>
            )}
          </ul>
        </div>
        <div className="fl h-100 min-vh-100 w-100 w-80-ns pa3 bl-ns">
          { this.state.defaultRows.length > 0
            ? (
              <div>
                { tableBody }
                <Fieldset formValue={this.state.searchForm}>
                  <Field select="select" label="Columns">
                    <Input className="w-100" />
                  </Field>
                  <Field select="query" label="Query">
                    <Input className="w-100" />
                  </Field>
                  <button onClick={this.submitSearchForm}>Submit</button>
                </Fieldset>
                  { lookupBody }
              </div>
            )
            : <h1 className="f4">Please select a class to explore</h1>
          }
        </div>
      </div>
    );
  }
}

export default withRouter(Metadata);
