/* eslint-disable jsdoc/require-file-overview, no-undef */

const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");

module.exports = withStorybook(getDefaultConfig(__dirname), { configPath: "./.rnstorybook", enabled: true });
