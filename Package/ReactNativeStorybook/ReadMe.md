*&copy; 2026 Gage Sorrell.  Released under the [MIT license](./License.md).*

# @sorrell/docs-react-native-storybook

Reusable React Native Storybook infrastructure for Sorrell documentation
projects. The package provides provider composition, persistent story and theme
selection, Metro configuration helpers, decorators, controls defaults, and
native article primitives.

Native integrations such as safe-area, gesture-handler, keyboard-controller,
and AsyncStorage are supplied by the consuming Expo application through the
typed adapter interfaces. This keeps the library usable with the application’s
chosen native versions.
