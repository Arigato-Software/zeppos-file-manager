import { getText } from '@zos/i18n'
import { px } from '@zos/utils';
import { exit, back } from '@zos/router'
import { scrollTo } from '@zos/page'
import { createWidget, widget, align, prop, event, getTextLayout } from '@zos/ui'

const globalData = getApp()._options.globalData;

// Получить левое начало экрана в позиции y для круглого экрана
export function getLeftX(y) {
  y += px(32);
  if (y < px(32)) y = px(32);
  if (y > px(448)) y = px(448);
  return globalData.leftX[y];
  /*const c = px(240);
  const a = Math.abs(c - y);
  return c - Math.floor(Math.sqrt(c * c - a * a));*/
}

export function showBottom(ypos, yoffset){
    // Кнопка [НАЗАД]

    const height = px(40);
    createWidget(widget.BUTTON, {
        x: px((480 - 100) / 2),
        y: ypos,
        w: px(100),
        h: height,
        radius: px(12),
        normal_color: 0x69ac50,
        press_color: 0x94ae88,
        text: getText('back'),
        click_func: () => back()
    });

    ypos += height;

    showEmptiness(ypos, yoffset);
}

export function showEmptiness(ypos, yoffset){
    const height = ypos - yoffset < px(480) ? px(480) - ypos + yoffset : px(480 / 2 - 64);
    createWidget(widget.TEXT, {
        x: 0,
        y: ypos,
        w: px(480),
        h: height,
        color: 0x000000,
        text: ''
    });
    return height;
}

export function showExit(){
    const height = px(40);
    createWidget(widget.BUTTON, {
        x: px((480 - 100) / 2),
        y: height,
        w: px(100),
        h: height,
        radius: px(12),
        normal_color: 0xfc6950,
        press_color: 0xfeb4a8,
        text: getText('exit'),
        click_func: () => exit()
    });
    scrollTo({y: -height * 2});
    return height * 2;
}

export function showLoading(ypos = 0){
    return createWidget(widget.TEXT, {
        x: 0,
        y: ypos,
        w: px(480),
        h: px(480),
        text_size: px(24),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        color: 0xffffff,
        text: getText('loading')
    });
}

export function showData(data, ypos = 0){
    createWidget(widget.TEXT, {
        x: 0,
        y: px(32) + ypos,
        w: px(480),
        h: px(64),
        text_size: px(24),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        color: 0xffffff,
        text: data
    });
}

export function showPath(path, ypos = 0) {
    createWidget(widget.TEXT, {
        x: 0,
        y: px(96) + ypos,
        w: px(480),
        h: px(64),
        text_size: px(24),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        color: 0xffffff,
        text: path
    });
}

export function IntToHex(int, len = 1){
    let hex = int.toString(16).toUpperCase();
    if (hex.length < len) hex = '0'.repeat(len - hex.length) + hex;
    return hex;
}