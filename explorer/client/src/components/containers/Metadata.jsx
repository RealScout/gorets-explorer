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
    shared: {
      connection: React.PropTypes.any,
      metadata: React.PropTypes.any,
      resource: React.PropTypes.any,
      class: React.PropTypes.any,
      fields: React.PropTypes.any,
      rows: React.PropTypes.any,
    },
    onRowsSelected: React.PropTypes.Func,
    onRowsDeselected: React.PropTypes.Func,
    onClassSelected: React.PropTypes.Func,
  }

  static defaultProps = {
    connection: { id: 'n/a' },
    metadata: MetadataService.empty,
  }

  constructor(props) {
    super(props);

    const mtable = props.shared.class['METADATA-TABLE'];
    const field = (mtable) ? mtable.Field : [];
    const defaultRows = (mtable) ? mtable.Field : [];
    const selectedFieldSet = [];
    defaultRows.forEach(f => {
      Object.keys(f).forEach(key => {
        if (selectedFieldSet.includes(key)) {
          return;
        }
        selectedFieldSet.push(key);
      });
    });
    this.state = {
      filters: {},
      defaultRows: field,
      selectedClassRows: field,
      selectedFieldSet,
    };
    this.handleGridSort = this.handleGridSort.bind(this);
    this.onRowsSelected = this.onRowsSelected.bind(this);
    this.onRowsDeselected = this.onRowsDeselected.bind(this);
  }

  onRowsSelected(rows) {
    this.props.onRowsSelected(rows);
  }

  onRowsDeselected(rows) {
    this.props.onRowsDeselected(rows);
  }

  onClassSelected(res, cls) {
    this.props.onClassSelected(res, cls);
    const defaultRows = cls['METADATA-TABLE'].Field;
    const selectedClassRows = cls['METADATA-TABLE'].Field;
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
      defaultRows,
      selectedClassRows,
      selectedFieldSet,
    });
  }

  onClearFilters = () => {
    this.setState({ filters: {} });
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

  // TODO row selection and filters arent playing well together
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
    const { selectedClassRows } = this.state;
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
      const selectedResource = this.props.shared.resource;
      const selectedClass = this.props.shared.class;
      tableBody = (
        <div>
          {selectedResource
            ? (
              <span>
                <span className="b">{selectedResource.ResourceID} </span>
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
            rowSelection={{
              showCheckbox: true,
              enableShiftSelect: true,
              onRowsSelected: this.onRowsSelected,
              onRowsDeselected: this.onRowsDeselected,
              selectBy: {
                indexes: this.props.shared.fields,
              },
            }}
          />
        </div>
      );
    } else {
      tableBody = null;
    }
    const system = this.props.shared.metadata.System;
    return (
      <div>
        <div className="fl h-100-ns w-100 w-20-ns no-list-style pa3 overflow-x-scroll nowrap">
          <h1 className="f5" title={system.SystemDescription}>
            {system.SystemID}
          </h1>
          <ul className="pa0 ma0">
            {system['METADATA-RESOURCE'].Resource.map((r) =>
              <li className="mb2">
                <div title={r.Description} className="b">{r.ResourceID}</div>
                <ul className="pa0 pl3 mv1">
                  {r['METADATA-CLASS'].Class.map((mClass) =>
                    <li
                      onClick={() => this.onClassSelected(r, mClass)}
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
