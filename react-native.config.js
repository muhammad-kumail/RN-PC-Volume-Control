// react-native.config.js;
module.exports = {
  dependencies: {
    // Remove any entries like this
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts/'],
};
