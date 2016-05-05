import React, { Component, PropTypes } from 'react';

import ObjectDescription from '../object/ObjectDescription';
import ObjectPreview from '../object/ObjectPreview';
import { ExpandGlyph } from '../styles/glyphs'

import { DEFAULT_ROOT_PATH, isExpandable, getPathsState } from './pathUtils'

// Styles
import objectStyles from '../object/objectStyles';
const styles = {
  base: {
    fontFamily: 'Menlo, monospace',
    fontSize: '11px',
    lineHeight: '14px',
    cursor: 'default',
  },
  propertyNodesBox: {
    paddingLeft: '12px',
  },
  property: {
    paddingTop: '2px',
  },
};

// Wrapper around inspector
const InspectorBox = ({ children }) =>
  <div style={styles.base}>
    { children }
  </div>

// a box with left padding containing the property nodes
const PropertyNodesBox = ({ children }) =>
   <div style={styles.propertyNodesBox}>{ children }</div>

export default class ObjectInspector extends Component {
  constructor(props) {
    super(props);

    if(props.depth === 0){ // root node
      this.state = {
        expandedPaths: getPathsState(props.expandLevel, props.expandPaths, props.data, props.name)
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.depth === 0){
      this.setState({
        expandedPaths: getPathsState(nextProps.expandLevel, nextProps.expandPaths, nextProps.data, nextProps.name, this.state.expandedPaths)
      })
    }
  }

  componentWillMount(){
    if (typeof React.initializeTouchEvents === 'function') {
      React.initializeTouchEvents(true);
    }
  }

  getExpanded(path){
    const expandedPaths = this.state.expandedPaths;
    if (expandedPaths !== undefined && typeof expandedPaths[path] !== 'undefined') {
      return expandedPaths[path];
    }
    return false;
  }

  setExpanded(path, expanded){
    const expandedPaths = this.state.expandedPaths;
    expandedPaths[path] = expanded;
    this.setState({expandedPaths: expandedPaths});
  }

  handleClick() {
    // console.log(this.props.data);
    if (isExpandable(this.props.data)) {
      if (this.props.depth > 0) {
        this.props.setExpanded(this.props.path, !this.props.getExpanded(this.props.path));
      }
      else{
        this.setExpanded(this.props.path, !this.getExpanded(this.props.path));
      }
    }
  }

  render() {
    const { data, name, showNonenumerable, isNonenumerable } = this.props

    const { depth, path } = this.props

    const setExpanded = (depth === 0) ? (this.setExpanded.bind(this)) : this.props.setExpanded;
    const getExpanded = (depth === 0) ? (this.getExpanded.bind(this)) : this.props.getExpanded;

    const expanded = getExpanded(path);
    let expandGlyph
    if(isExpandable(data)){
      expandGlyph = <ExpandGlyph expanded={expanded}></ExpandGlyph>
    }
    else{
      // root node doesn't need placeholder
      if(depth === 0){
        expandGlyph = <span></span>
      }
      else{
        expandGlyph = <ExpandGlyph empty></ExpandGlyph>
      }
    }

    // if current node is expanded render the property nodes
    let propertyNodesBox;
    if(expanded){
      let propertyNodes = [];

      Object.getOwnPropertyNames(data).forEach(propertyName => {
        // enumerables
        if(data.propertyIsEnumerable(propertyName)){
          const propertyValue = data[propertyName];
          propertyNodes.push(<ObjectInspector getExpanded={getExpanded}
                                              setExpanded={setExpanded}
                                              path={`${path}.${propertyName}`} // TODO: escape '.' in propertyName
                                              depth={depth + 1}
                                              key={propertyName}
                                              name={propertyName}
                                              data={propertyValue}
                                              showNonenumerable={showNonenumerable}></ObjectInspector>);
        }
        // non enumerables, only show if showNonenumerable is enabled
        else if(showNonenumerable){
          let propertyValue
          // To work around this error if propertyName === 'caller' || propertyName === 'arguments'
          // 'caller' and 'arguments' are restricted function properties and cannot be accessed in this context
          try{
            propertyValue = data[propertyName]
          }
          catch(e){
          }

          if(propertyValue !== undefined)
            propertyNodes.push(<ObjectInspector getExpanded={getExpanded}
                                                setExpanded={setExpanded}
                                                path={`${path}.${propertyName}`} // TODO: escape '.' in propertyName
                                                depth={depth + 1}
                                                key={propertyName}
                                                name={propertyName}
                                                data={propertyValue}
                                                showNonenumerable={showNonenumerable}
                                                isNonenumerable></ObjectInspector>);
        }
      })

      // Object.getPrototypeOf (__proto__)
      if(showNonenumerable && data !== Object.prototype /* already added */){
        propertyNodes.push(<ObjectInspector getExpanded={getExpanded}
                                            setExpanded={setExpanded}
                                            path={`${path}.__proto__`} // TODO: escape '.' in propertyName
                                            depth={depth + 1}
                                            key="__proto__"
                                            name="__proto__"
                                            data={Object.getPrototypeOf(data)}
                                            showNonenumerable={showNonenumerable}
                                            isNonenumerable></ObjectInspector>)
      }

      propertyNodesBox = <PropertyNodesBox>{propertyNodes}</PropertyNodesBox>;
    }

    return (
      <InspectorBox>
        <span style={styles.property} onClick={this.handleClick.bind(this)}>
          {expandGlyph}
          <ObjectPreview object={data} name={name} isNonenumerable={isNonenumerable} />
        </span>
        {propertyNodesBox}
      </InspectorBox>
    );
  }
}

ObjectInspector.propTypes = {
  name: PropTypes.string,
  data: PropTypes.any,

  showNonenumerable: PropTypes.bool, // switch to show non-enumerable properties
  isNonenumerable: PropTypes.bool, // am myself a non-enumerable property? for styling purposes

  expandLevel: PropTypes.number,
  expandPaths: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array
  ]),

  depth: PropTypes.number.isRequired,
  path: PropTypes.string // path is dot separated property names to reach the current node
}

ObjectInspector.defaultProps = {
  name: void 0,
  data: undefined,

  showNonenumerable: false,
  isNonenumerable: false,

  expandLevel: undefined,
  expandPaths: undefined,

  depth: 0,
  path: DEFAULT_ROOT_PATH
}