import { getText } from '@zos/i18n'
import * as Styles from 'zosLoader:./index.[pf].layout.js'
import { px } from '@zos/utils';
import { setWakeUpRelaunch } from '@zos/display'
import { createWidget, deleteWidget, widget, align, getImageInfo, prop, text_style, event, getTextLayout } from '@zos/ui'
import { readFileSync, openSync, readSync, O_RDONLY, statSync } from '@zos/fs'
import { scrollTo } from '@zos/page'
import { create, id } from '@zos/media'
import { showLoading, showExit, showBottom, IntToHex } from '../utils'
import { parseZipFile } from '../libs/zip'

const globalData = getApp()._options.globalData;

Page({
  onInit(params) {
    this.file = JSON.parse(params);
    setWakeUpRelaunch({relaunch: true}); // Чтобы страница не закрывалась когда потухнет экран
  },

  build() {

    createWidget(widget.PAGE_SCROLLBAR);
    
    this.yoffset = showExit();
    this.ypos = this.yoffset;

    // Иконка
    this.ypos += px(32);
    createWidget(widget.IMG, {
      x: px(480 / 2 - 56 / 2),
      y: this.ypos,
      w: px(56),
      h: px(64),
      src: this.file.icon
    });

    // Имя файла
    let data = this.file.name;
    if (this.file.type === 'image'){ // Размер изображения
      this.imageInfo = getImageInfo(globalData.explorer.getFullPath() + '/' + this.file.name);
      data += '\n' + getText('resolution') + this.imageInfo.width + ' x ' + this.imageInfo.height;
    }
    const { height } = getTextLayout(data, {
      text_size: px(24),
      text_width: px(480),
      wrapped: 0
    });

    createWidget(widget.TEXT, {
      x: 0,
      y: this.ypos + px(64),
      w: px(480),
      h: height,
      text_size: px(24),
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      color: 0xffffff,
      text: data
    });

    this.loadingWidget = showLoading(this.yoffset);
    this.ypos += height + px(96);

    setTimeout(() => this.showFile(), 300);
        
  },

  showFile(){
    deleteWidget(this.loadingWidget);

    // Путь
    this.path = globalData.explorer.getFullPath();
    if (this.path.slice(-1) !== '/') this.path += '/';
    this.path += this.file.name;
    
    switch (this.file.type){
      case 'text': this.showTextFile(); break;
      case 'btxt': this.showBtxtFile(); break;
      case 'image': this.showImageFile(); break;
      case 'font': this.showFontFile(); break;
      case 'archive': this.showZipFile(); break;
      case 'audio': this.showAudio(); break;
      default: this.showBinary();
    }

    this.ypos += px(32);

    showBottom(this.ypos, this.yoffset);

  },

  loadTextFile(){
    this.tooBig = false;
    try{
      const stat = statSync({ path: this.path });
      let size = stat !== undefined ? stat.size : 0;
      if (size > 20000){ // Примерный лимит на объем текстовых данных в байтах
        size = 20000;
        this.tooBig = true;
      }
      const arrayBuffer = new ArrayBuffer(size);
      const fd = openSync({
        path: this.path,
        flag: O_RDONLY,
      });
      readSync({
        fd: fd,
        buffer: arrayBuffer,
        options: {
          length: size
        }
      });
      this.buffer = Buffer.from(arrayBuffer);
    } catch(e) {
      this.onError(getText('file_error'));
      return false;
    }

    if (this.tooBig){ // Файл слишком большой
      this.onError(getText('toobig'));
    }
    return true;
  },

  // Вывод текстового файла
  showTextFile(){
    if (! this.loadTextFile()) return;

    const text = this.buffer.toString("utf-8") + (this.tooBig ? '....' : '');
    this.showTextPart(text);

  },

  // Отобразить файл btxt (многострочный текст с разделением нулевыми кодами)
  showBtxtFile(){
    if (! this.loadTextFile()) return;

    this.screenOverflow = false;

    let start = 0;
    let end;
    // Находим каждый символ с кодом 0 и создаем строки
    while ((end = this.buffer.indexOf(0, start)) !== -1) {
      // Преобразуем фрагмент в строку и добавляем в массив
      let text = this.buffer.slice(start, end).toString("utf-8");
      start = end + 1; // Сдвигаем начальную позицию
      this.showTextPart(text);
      if (this.screenOverflow) break;

      // Разграничительная линия
      if (start < this.buffer.length) {
        this.ypos += 8;
        text = '* * *';
        const { height } = getTextLayout(text, {
          text_size: px(24),
          text_width: px(480 - 8 * 2),
          wrapped: 0
        });
        createWidget(widget.TEXT, {
          x: px(8),
          y: this.ypos,
          w: px(480 - 8 * 2),
          h: height,
          text_size: px(24),
          align_h: align.CENTER_H,
          align_v: align.TOP,
          color: 0x808080,
          text_style: text_style.NONE,
          text: text
        });
        this.ypos += height;
      }
    }

  },

  showTextPart(text){
    const { height } = getTextLayout(text, {
      text_size: px(24),
      text_width: px(480 - 8 * 2),
      wrapped: 1
    });

    let h = height;
    if (this.ypos + h > 32000) { // вообще предел 65535, но прокрутка экрана перестает работать раньше (с 32767)
      h = 32000 - this.ypos;
      this.screenOverflow = true;
    }

    createWidget(widget.TEXT, {
      x: px(8),
      y: this.ypos,
      w: px(480 - 8 * 2),
      h: h,
      text_size: px(24),
      align_h: align.LEFT,
      align_v: align.TOP,
      color: 0xffffff,
      text_style: text_style.WRAP,
      text: text
    });

    this.ypos += h;
  },

  // Вывод изображения
  showImageFile(){
    let width = this.imageInfo.width;
    let height = this.imageInfo.height;
    let auto_scale = false;
    const maxSize = Math.max(this.imageInfo.width, this.imageInfo.height);
    if (maxSize > px(480)){
      const k = px(480) / maxSize;
      width = Math.floor(k * width);
      height = Math.floor(k * height);
      auto_scale = true;
    }

    createWidget(widget.IMG, {
      x: Math.floor(px(480 / 2) - width / 2),
      y: this.ypos,
      w: width,
      h: height,
      auto_scale: auto_scale,
      src: this.path,
    });

    if (this.ypos + height - this.yoffset > px(480)){
      scrollTo({y: -this.ypos - height / 2 + px(480 / 2)});
    }

    this.ypos += height;
  },

  // Вывод шрифта
  showFontFile(){

    // Таблица ASCII и русские буквы
    const text = [
      ...Array.from({ length: 126 - 33 + 1 }, (_, i) => String.fromCharCode(i + 33)),
      ...Array.from({ length: 'Я'.charCodeAt(0) - 'А'.charCodeAt(0) + 1 }, (_, i) => String.fromCharCode(i + 'А'.charCodeAt(0))),
      ...Array.from({ length: 'я'.charCodeAt(0) - 'а'.charCodeAt(0) + 1 }, (_, i) => String.fromCharCode(i + 'а'.charCodeAt(0))),
    ].join(' ');
    
    const { height } = getTextLayout(text, {
      text_size: px(32),
      text_width: px(480 - 44 * 2),
      wrapped: 1
    });

    createWidget(widget.TEXT, {
      x: px(44),
      y: this.ypos,
      w: px(480 - 44 * 2),
      h: height,
      text_size: px(32),
      align_h: align.CENTER_H,
      align_v: align.TOP,
      color: 0xffffff,
      text_style: text_style.WRAP,
      font: this.path,
      text: text
    });

    this.ypos += height;
  },

  // Вывод содержимого (списка файлов) zip-архива
  showZipFile(){
    let root = {};
    try{
      const arrayBuffer = readFileSync({path: this.path});
      const buffer = new DataView(arrayBuffer);
      root = parseZipFile(buffer);
    } catch(e) {
      this.onError(getText('file_error'));
      return;
    }

    this.showTree(root, '');
  },

  showTree(root, prefix){
    const entries = Object.entries(root).sort((a, b) => a[1] === null ? 1 : (b[1] === null ? -1 : 0));

    for (const [index, [key, value]] of entries.entries()) {
      const text = prefix + (index === entries.length - 1 ? '└' : '├') + key;
      this.showTextLine(text);
      if (value !== null){
        this.showTree(value, prefix + (index === entries.length - 1 ? '    ' : '│'));
      }
    }
  },

  showTextLine(text){
    const { height } = getTextLayout(text, {
      text_size: px(24),
      text_width: px(480 - 8 * 2),
      wrapped: 0
    });
    createWidget(widget.TEXT, {
      x: px(8),
      y: this.ypos,
      w: px(480 - 8 * 2),
      h: height,
      text_size: px(24),
      align_h: align.LEFT,
      align_v: align.TOP,
      color: 0xffffff,
      text_style: text_style.ELLIPSIS,
      text: text
    });
    this.ypos += height - px(8);
  },

  // Вывод бинарного файла
  showBinary(){
    let data = [];
    let tooBig = false;
    try{
      const stat = statSync({ path: this.path });
      let size = stat !== undefined ? stat.size : 0;
      if (size > 8192){ // Это не максимум, но ограничим просмотр 8 Кб
        size = 8192;
        tooBig = true;
      }
      const arrayBuffer = new ArrayBuffer(size);
      const fd = openSync({
        path: this.path,
        flag: O_RDONLY,
      });
      readSync({
        fd: fd,
        buffer: arrayBuffer,
        options: {
          length: size
        }
      });
      data = new Uint8Array(arrayBuffer);
    } catch(e) {
      this.onError(getText('file_error'));
      return;
    }

    if (tooBig){ // Файл слишком большой
      this.onError(getText('toobig'));
    }

    let text = '';
    for (let lineAddr = 0; lineAddr < data.length; lineAddr += 8 ){
      const line = data.slice(lineAddr, lineAddr + 8);
      const addrText = IntToHex(lineAddr, 4);
      const hexs = [];
      const chars = [];
      line.forEach((code) => {
        hexs.push(IntToHex(code, 2));
        chars.push(code > 31 && code < 127 ? String.fromCharCode(code) : '.');
      });
      let hexText = hexs.join(' ');
      const charText = chars.join('');
      if (hexText.length < 23) hexText += ' '.repeat(23 - hexText.length);
      text += addrText + '|' + hexText + '|' + charText + '\n';
    }
    height = px(22) * Math.ceil(data.length / 8);
    if (tooBig && text !== ''){
      text += '2000|....\n';
      height += px(22);
    }
    createWidget(widget.TEXT, {
      x: px(32),
      y: this.ypos,
      w: px(480 - 32),
      h: height,
      text_size: px(18),
      align_h: align.LEFT,
      align_v: align.TOP,
      color: 0xffffff,
      text_style: text_style.WRAP,
      font: 'fonts/FiraMono-Regular.ttf',
      text: text
    });
    this.ypos += height;

  },

  // Воспроизведение аудио-файла
  showAudio(){

    this.onError(getText('under_construction'));

    /*
    const player = create(id.PLAYER);
    console.log('player: ' + player);
    player.addEventListener(player.event.PREPARE, function (result) {
      if (result) {
        console.log('=== prepare succeed ===')
        player.start()
      } else {
        console.log('=== prepare fail ===')
        player.release()
      }
    })
    player.addEventListener(player.event.COMPLETE, function (result) {
      console.log('=== play end ===')
      player.stop()
      player.release()
    })
    player.setSource(player.source.FILE, { file: 'raw/1.mp3' });
    player.prepare();
    player.start();
    console.log('Info: ' + JSON.stringify(player.getMediaInfo()));
    */

  },

  onError(text){
    const h = px(48);
    createWidget(widget.TEXT, {
      x: px(0),
      y: this.ypos,
      w: px(480),
      h: h,
      text_size: px(24),
      align_h: align.CENTER_H,
      align_v: align.TOP,
      color: 0xff8080,
      text: text
    });
    this.ypos += h;
  },

  onDestroy() {

  }

})
