# metadisk
A modular filesystem and disk visualizer for an operating system running on the Very-Simple-File-System (VSFS), written in TypeScript with React.

# React + TypeScript + Vite
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# Setup Instructions for Adding Additional Modules
Adding additional modules for Metadisk is relatively straightforward. Using the existing APIs and the existing Redux stores, you can build custom React apps (essentially a 'root' component for your app). Once you've constructed your app, simply modify the `register-apps.tsx` file with a new object that includes the name of the App, the app as a function, an icon to display for the app, whether or not the app should be enabled by default, and an optional `onChange` to determine what happens when the app is sent to the background.

Here's an example of a new app being registered:

```TypeScript
{
  // other apps above
    "Disk Simulator": {
        elementFn: MyCustomApp,
        muiIcon: MyCustomAppIcon,
        enabled: true,
        onChange: (enabled: boolean) => {
            // any logic here to execute when the `enabled` value is changed
        }
    }
}
```

