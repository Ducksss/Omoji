import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

chrome.commands.onCommand.addListener((command, tab) => {
  // open up popup
  if (command === 'open-up-pop-up')
    chrome.action.openPopup();
});
