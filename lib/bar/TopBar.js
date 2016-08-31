import React, { PropTypes } from 'react';
import {
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { BarContainer } from './BarContainer';

import Icon from 'react-native-vector-icons/Ionicons';

export default class TopBar extends React.Component {

  static propTypes = {
    displayed: PropTypes.bool,
    title: PropTypes.string,
    height: PropTypes.number,
    onBack: PropTypes.func,
  };

  static defaultProps = {
    displayed: false,
    title: '',
  };

  constructor(props) {
    super(props);
  }

  renderBackIcon () {
    if (Platform.OS === 'ios') {
      return (
        <Icon name="ios-arrow-back" style={styles.backButton} size={30} color='#fff' />
      )
    }
    else {
      return(
        <Icon name="ios-arrow-round-back" style={styles.backButton} size={30} color='#fff' />
      )
    }
  }

  render() {
    const {
      displayed,
      title,
      height,
      onBack,
    } = this.props;

    return (
      <BarContainer
        style={styles.container}
        displayed={displayed}
        height={height}
      >
        <TouchableOpacity style={styles.backContainer} onPress={onBack}>
          { this.renderBackIcon() }
          {
            Platform.OS === 'ios' &&
            <Text style={[styles.text, styles.backText]}>Geri</Text>
          }
        </TouchableOpacity>
        <Text style={styles.text}>{title}</Text>
      </BarContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 30,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  backContainer: {
    position: 'absolute',
    flexDirection: 'row',
    left: 0,
    top: 16,
  },
  backText: {
    paddingTop: 14,
  },
  backButton: {
    paddingTop: 10,
    paddingLeft: 5,
    paddingRight: 5,
  },
});
