import { getText } from '@zos/i18n'
import * as Styles from 'zosLoader:./index.[pf].layout.js'
import { px } from '@zos/utils';
import { createWidget, deleteWidget, widget, align, text_style, event, prop, getTextLayout } from '@zos/ui'
import { push } from '@zos/router'
import { getDiskInfo } from '@zos/device'
import { setWakeUpRelaunch } from '@zos/display'
import { showLoading, showData, showExit, showEmptiness } from '../utils'

const globalData = getApp()._options.globalData;

Page({
  onInit() {
    setWakeUpRelaunch({relaunch: true}); // Чтобы страница не закрывалась когда потухнет экран
  },

  build() {

    this.yoffset = showExit();
    this.ypos = this.yoffset;

    this.loadingWidget = showLoading(this.ypos);

    setTimeout(() => this.showDrivers(), 300);
    
  },

  startCache(){
    if (globalData.leftX.length == 0) { // Кэширование при запуске приложения

      // Кэшируем левые позиции круглого экрана в зависимости от координаты y
      const c = px(240);
      for (let y = 0; y <= 448; y++) {
        const a = Math.abs(c - y);
        globalData.leftX[y] = c - Math.floor(Math.sqrt(c * c - a * a));
      }

      // Размер диска
      const { total, free } = getDiskInfo();
      globalData.total = globalData.explorer.getSizeStr(total);
      globalData.free = globalData.explorer.getSizeStr(free);
    }

  },

  showDrivers(){
    deleteWidget(this.loadingWidget);

    this.startCache();

    // Статистика по диску
    const data = getText('total') + globalData.total + '\n' + getText('free') + globalData.free;
    showData(data, this.ypos);

    // Подсчет координаты x, чтобы вывести список по середине экрана
    const param = {
      text_size: px(24),
      text_width: px(480),
      wrapped: 0
    };
    const widths = [];
    for (const prefix of globalData.explorer.prefixes){
      const { width } = getTextLayout(prefix.name, param);
      widths.push(width + px(8));
    }

    let x = Math.floor(px(240) - (Math.max.apply(null, widths) + px(64)) / 2); // Прибавили ширину картинки 64
    this.ypos += px(128);
    for (const i in globalData.explorer.prefixes){
      const prefix = globalData.explorer.prefixes[i];

      const imgWidget = createWidget(widget.IMG, {
        x: x,
        y: this.ypos,
        w: px(64),
        h: px(64),
        src: prefix.icon
      });
      imgWidget.addEventListener(event.CLICK_UP, () => this.onClick(prefix));
      
      const nameWidget = createWidget(widget.BUTTON, {
        x: x + px(64),
        y: this.ypos,
        w: widths[i],
        h: px(64),
        color: 0xffffff,
        text_size: px(24),
        normal_color: 0x000000,
        press_color: 0x404040,
        radius: px(8),
        text: prefix.name,
        click_func: () => this.onClick(prefix),
        longpress_func: () => this.onLongpress(prefix)
      });
      
      this.ypos += px(64);
    }

    this.ypos = this.yoffset + px(480);
    createWidget(widget.TEXT, {
      x: 0,
      y: this.ypos,
      w: px(480),
      h: px(32),
      text_size: px(24),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      color: 0xffffff,
      text_style: text_style.NONE,
      text: 'Arigato Software, 2024'
    });

    showEmptiness(this.ypos, this.yoffset);

  },

  onClick(prefix){
    console.log(prefix.path);
    globalData.explorer.prefix = prefix;
    globalData.yoffsets.push(0);
    push({url: 'page/files-list'});
  },

  onLongpress(prefix){
    console.log(prefix.path);
    push({
      url: 'page/prefix-info',
      params: prefix
    });
  },

  onDestroy() {
  }

})
