# Native applications

`Application/Development` contains exhaustive workspace-source stories.
`Application/Demonstration` contains the public-API showcase. Both are Expo
dev-client applications and should remain Android/iOS compatible.

Keep app-level providers in `App.tsx` and Storybook configuration in
`.rnstorybook`. Use the public React Native Storybook package rather than
reaching into its implementation files.
