import { Explorer } from './libs/explorer';

App({
  globalData: {
    explorer: new Explorer(),
    leftX: [],
    yoffsets: [],
    total: '-',
    free: '-',
  },

  onCreate(options) {
  },

  onDestroy(options) {
  }
})