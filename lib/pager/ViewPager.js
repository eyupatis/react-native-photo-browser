'use strict';

var React = require('react-native');
var {
  Dimensions,
  Text,
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
  PropTypes,
  StyleSheet,
} = React;

var StaticRenderer = require('react-native/Libraries/Components/StaticRenderer');

var deviceWidth = Dimensions.get('window').width;

import ViewPagerDataSource from './ViewPagerDataSource';

var ViewPager = React.createClass({
  statics: {
    DataSource: ViewPagerDataSource,
  },

  propTypes: {
    ...View.propTypes,
    dataSource: PropTypes.instanceOf(ViewPagerDataSource).isRequired,
    renderPage: PropTypes.func.isRequired,
    onChangePage: PropTypes.func,
    animation: PropTypes.func,
  },

  fling: false,

  getDefaultProps() {
    return {
      animation: function(animate, toValue, gs) {
        return Animated.spring(animate,
          {
            toValue: toValue,
            friction: 10,
            tension: 50,
          })
      },
    }
  },

  getInitialState() {
    return {
      currentPage: 0,
      viewWidth: 0,
      scrollValue: new Animated.Value(0)
    };
  },

  componentWillMount() {
    this.childIndex = 0;

    var release = (e, gestureState) => {
      var relativeGestureDistance = gestureState.dx / deviceWidth,
          //lastPageIndex = this.props.children.length - 1,
          vx = gestureState.vx;

      var step = 0;
      if (relativeGestureDistance < -0.5 || (relativeGestureDistance < 0 && vx <= 0.5)) {
        step = 1;
      } else if (relativeGestureDistance > 0.5 || (relativeGestureDistance > 0 && vx >= 0.5)) {
        step = -1;
      }

      this.props.hasTouch && this.props.hasTouch(false);

      this.movePage(step, gestureState);
    }

    this._panResponder = PanResponder.create({
      // Claim responder if it's a horizontal pan
      onMoveShouldSetPanResponder: (e, gestureState) => {
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          if (!this.fling) {
            this.props.hasTouch && this.props.hasTouch(true);
            return true;
          }
        }
      },

      // Touch is released, scroll to the one that you're closest to
      onPanResponderRelease: release,
      onPanResponderTerminate: release,

      // Dragging, move the view with the touch
      onPanResponderMove: (e, gestureState) => {
        var dx = gestureState.dx;
        var offsetX = -dx / this.state.viewWidth + this.childIndex;
        this.state.scrollValue.setValue(offsetX);
      },
    });
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.dataSource) {
      var maxPage = nextProps.dataSource.getPageCount() - 1;
      var constrainedPage = Math.max(0, Math.min(this.state.currentPage, maxPage));
      this.setState({
        currentPage: constrainedPage,
      });

      this.state.scrollValue.setValue(constrainedPage > 0 ? 1 : 0);
      this.childIndex = Math.min(this.childIndex, constrainedPage);
    }

  },

  _startAutoPlay() {
    if (!this._autoPlayer) {
      this._autoPlayer = this.setInterval(
        () => {this.movePage(1);},
        5000
      );
    }
  },

  goToPage(pageNumber) {

    var pageCount = this.props.dataSource.getPageCount();
    if (pageNumber < 0 || pageNumber >= pageCount) {
      console.error('Invalid page number: ', pageNumber);
      return
    }

    var step = pageNumber - this.state.currentPage;
    this.movePage(step);
  },

  movePage(step, gs) {
    var pageCount = this.props.dataSource.getPageCount();
    var pageNumber = this.state.currentPage + step;
    pageNumber = Math.min(Math.max(0, pageNumber), pageCount - 1);

    var moved = pageNumber !== this.state.currentPage;
    var scrollStep = (moved ? step : 0) + this.childIndex;

    this.fling = true;

    var nextChildIdx = 0;
    if (pageNumber > 0) {
      nextChildIdx = 1;
    }

    this.props.animation(this.state.scrollValue, scrollStep, gs)
      .start((event) => {
        if (event.finished) {
          this.fling = false;
          this.childIndex = nextChildIdx;
          this.state.scrollValue.setValue(nextChildIdx);
          this.setState({
            currentPage: pageNumber,
          });
        }
        moved && this.props.onChangePage && this.props.onChangePage(pageNumber);
      });
  },

  getCurrentPage() {
    return this.state.currentPage;
  },

  _getPage(pageIdx: number, loop = false: boolean) {
    var dataSource = this.props.dataSource;
    var pageID = dataSource.pageIdentities[pageIdx];
    return (
      <StaticRenderer
        key={'p_' + pageID + (loop ? '_1' : '')}
        shouldUpdate={true}
        render={this.props.renderPage.bind(
          null,
          dataSource.getPageData(pageIdx),
          pageID,
          this.state.currentPage
        )}
      />
    );
  },

  render() {
    var dataSource = this.props.dataSource;
    var pageIDs = dataSource.pageIdentities;

    var bodyComponents = [];

    var pagesNum = 0;
    var hasLeft = false;
    var viewWidth = this.state.viewWidth;

    if(pageIDs.length > 0 && viewWidth > 0) {
      // left page
      if (this.state.currentPage > 0) {
        bodyComponents.push(this._getPage(this.state.currentPage - 1));
        pagesNum++;
        hasLeft = true;
      } else if (this.state.currentPage == 0) {
        bodyComponents.push(this._getPage(pageIDs.length - 1, true));
        pagesNum++;
        hasLeft = true;
      }

      // center page
      bodyComponents.push(this._getPage(this.state.currentPage));
      pagesNum++;

      // right page
      if (this.state.currentPage < pageIDs.length - 1) {
        bodyComponents.push(this._getPage(this.state.currentPage + 1));
        pagesNum++;
      } else if (this.state.currentPage == pageIDs.length - 1) {
        bodyComponents.push(this._getPage(0, true));
        pagesNum++;
      }
    }

    var sceneContainerStyle = {
      width: viewWidth * pagesNum,
      flex: 1,
      flexDirection: 'row'
    };

    // this.childIndex = hasLeft ? 1 : 0;
    // this.state.scrollValue.setValue(this.childIndex);
    var translateX = this.state.scrollValue.interpolate({
      inputRange: [0, 1], outputRange: [0, -viewWidth]
    });

    return (
      <View style={{flex: 1}}
        onLayout={(event) => {
            // console.log('ViewPager.onLayout()');
            var viewWidth = event.nativeEvent.layout.width;
            if (!viewWidth || this.state.viewWidth === viewWidth) {
              return;
            }
            this.setState({
              currentPage: this.state.currentPage,
              viewWidth: viewWidth,
            });
          }}
        >

        <Animated.View style={[sceneContainerStyle, {transform: [{translateX}]}]}
          {...this._panResponder.panHandlers}>
          {bodyComponents}
        </Animated.View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
});

module.exports = ViewPager;