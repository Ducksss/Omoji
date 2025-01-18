import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

chrome.commands.onCommand.addListener((command, tab) => {
  // commands: {
  //   'name-of-command-passed-into-function': {
  //     suggested_key: 'Ctrl+Shift+Q',
  //     description: 'do somthing',
  //   },
  //   shortcut2: {
  //     suggested_key: 'Ctrl+Shift+A',
  //     description: 'do somthing else',
  //   },
  // },
  console.log(command);
});
