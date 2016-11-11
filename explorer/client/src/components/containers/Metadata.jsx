import React from 'react';
import { withRouter } from 'react-router';
import ReactDataGrid from 'react-data-grid';
import MetadataService from 'services/MetadataService';

const ReactDataGridPlugins = require('react-data-grid/addons');

const Toolbar = ReactDataGridPlugins.Toolbar;

class Metadata extends React.Component {

  static propTypes = {
    params: React.PropTypes.any,
    location: React.PropTypes.any,
    router: React.PropTypes.any,
    connection: React.PropTypes.any,
    metadata: React.PropTypes.any,
  }

  static defaultProps = {
    connection: { id: 'n/a' },
    metadata: MetadataService.empty,
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
      selectedClass: null,
      defaultRows: [],
      selectedClassRows: [],
      selectedFieldSet: [],
      filters: {},
    };
    this.handleGridSort = this.handleGridSort.bind(this);
    this.onCellSelected = this.onCellSelected.bind(this);
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
    let currentSearchVal = searchForm.value['select'] || '';
    if (currentSearchVal !== '') {
      currentSearchVal = `${currentSearchVal},`;
    }
    searchForm.value['select'] = `${currentSearchVal}${selectedVal}`;
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

  renderSelectedClassDescription(clazz) {
    return (
      <span title={clazz.Description}>
        {clazz.ClassName} - <span className="f6 moon-gray">{clazz.Description}</span>
      </span>
    );
  }

  render() {
    const { selectedClassRows, selectedClass } = this.state;
    let tableBody;
    if (selectedClassRows) {
      const availableFields = this.state.selectedFieldSet;
      const fieldSet = (selectedClassRows && selectedClassRows.length > 0)
        ? availableFields.map((name) => ({
          key: name,
          name,
          resizable: true,
          width: 200,
          sortable: true,
          filterable: true,
        }))
        : [];
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
    } else {
      tableBody = null;
    }
    return (
      <div>
        <div className="fl h-100-ns w-100 w-20-ns no-list-style pa3 overflow-x-scroll nowrap">
          <h1 className="f5" title={this.props.metadata.System.SystemDescription}>
            {this.props.metadata.System.SystemID}
          </h1>
          <ul className="pa0 ma0">
            {this.props.metadata.System['METADATA-RESOURCE'].Resource.map((r) =>
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