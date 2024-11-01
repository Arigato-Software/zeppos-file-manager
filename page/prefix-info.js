import { getText } from '@zos/i18n'
import * as Styles from 'zosLoader:./index.[pf].layout.js'
import { px } from '@zos/utils';
import { setWakeUpRelaunch } from '@zos/display'
import { createWidget, deleteWidget, widget, align, getImageInfo, text_style, event, getTextLayout } from '@zos/ui'
import { showLoading, getLeftX, showExit, showBottom } from '../utils'

const globalData = getApp()._options.globalData;

Page({
  onInit(params) {
    this.prefix = JSON.parse(params);
    setWakeUpRelaunch({relaunch: true}); // Чтобы страница не закрывалась когда потухнет экран
  },

  build() {

    this.yoffset = showExit();
    this.ypos = this.yoffset;

    // Иконка
    createWidget(widget.IMG, {
      x: px(480 / 2 - 64 / 2),
      y: px(32) + this.ypos,
      w: px(64),
      h: px(64),
      src: this.prefix.icon
    });

    // Тип объекта
    createWidget(widget.TEXT, {
      x: 0,
      y: px(96) + this.ypos,
      w: px(480),
      h: px(32),
      text_size: px(24),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      color: 0xffffff,
      text: getText('prefix')
    });

    // Префикс пути
    const path = this.prefix.path;

    const y = px(128);
    const x = getLeftX(y) + px(16);    
    const w = px(480) - 2 * x;
    const { height } = getTextLayout(path, {
      text_size: px(24),
      text_width: w,
      wrapped: 1
    });

    createWidget(widget.TEXT, {
      x: x,
      y: y + this.ypos,
      w: w,
      h: height,
      text_size: px(24),
      align_h: align.CENTER_H,
      align_v: align.TOP,
      color: 0xffffff,
      text_style: text_style.WRAP,
      text: path
    });

    this.loadingWidget = showLoading(this.ypos);
    this.ypos += y + height + px(32);
    
    setTimeout(() => this.showInfo(), 300);
        
  },

  showInfo(){
    deleteWidget(this.loadingWidget);

    // Информация об объекте
    data = '';
    globalData.explorer.prefix = this.prefix;
    const dir = globalData.explorer.dir();
    if (dir.folders > 0) data += getText('folders') + dir.folders
    if (dir.files > 0) data += (data !== '' ? '\n' : '') + getText('files') + dir.files + ' (' + globalData.explorer.getSizeStr(dir.filesSize) + ')';
    if (data === '') data = getText('empty');
    
    console.log('ok')
    const { height } = getTextLayout(data, {
      text_size: px(24),
      text_width: px(480),
      wrapped: 1
    });

    createWidget(widget.TEXT, {
      x: 0,
      y: this.ypos,
      w: px(480),
      h: height,
      text_size: px(24),
      align_h: align.CENTER_H,
      align_v: align.TOP,
      color: 0xffffff,
      text: data
    });

    this.ypos += height + px(32);

    showBottom(this.ypos, this.yoffset);

  },

  onDestroy() {

  }

})
