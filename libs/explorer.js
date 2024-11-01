/**
 * Файловый менеджер 
 * Arigato Softwatr, 2024
 */

import { getText } from '@zos/i18n'
import { readdirSync, statSync } from '@zos/fs'

export class Explorer {

    fileTypes = {
        'text': /(\.txt|\.js|\.json|\.xml|\.html|\.css|\.svg|\.md|\.gapp|__\$\$localstorage\$\$__)$/i,
        'btxt': /(\.btxt)$/i,
        'image': /(\.png)$/i,
        'audio': /(\.mp3|\.opus)$/i,
        'font': /(\.ttf)$/i,
        'archive': /(\.zip)$/i,
    }

    fileIcons = {
        'folder': 'icons/folder.png',
        'back': 'icons/back.png',
        'file': 'icons/file.png',
        'txt': 'icons/text.png',
		'md': 'icons/text.png',
        'btxt': 'icons/btxt.png',
        'js': 'icons/code.png',
        'json': 'icons/code.png',
        'png': 'icons/image.png',
        'mp3': 'icons/music.png',
        'opus': 'icons/music.png',
        'ttf': 'icons/font.png',
        'bin': 'icons/bin.png',
        'zip': 'icons/archive.png',
        'dat': 'icons/data.png',
        'xml': 'icons/web.png',
        'html': 'icons/web.png',
        'css': 'icons/web.png',
        'gapp': 'icons/web.png',
    }

    prefixes = [
        {
            name: '[root]',
            path: 'root://../../../',
            icon: 'icons/device-root.png'
        },
        {
            name: '[apps]',
            path: 'root://../',
            icon: 'icons/device-apps.png'
        },
        {
            name: '[data]',
            path: 'data://../',
            icon: 'icons/device-data.png'
        },
        {
            name: '[system]',
            path: 'system://',
            icon: 'icons/device-system.png'
        },
        {
            name: '[common]',
            path: 'common://',
            icon: 'icons/device-common.png'
        }
    ]
    
    constructor(){
        this.prefix = this.prefixes[0]; // system:// common:// root:// assets:// data://
        this.path = [];
        this.cache = [];
    }

    dir(){
        const path = this.getFullPath();
        if (this.cache.hasOwnProperty(path)) {
            return this.cache[path];
        }

        const dir = readdirSync({ path: path });
        const folders = [];
        const files = [];
        let filesSize = 0;
        folders.push({
            name: '..',
            ext: '',
            size: 0,
            type: 'back',
            icon: this.fileIcons['back']
        });

        if (dir !== undefined) {

            for (const name of dir) {
                const fullName = path + '/' + name;
                const stat = statSync({ path: fullName });
                const size = stat !== undefined ? stat.size : 0;
                const rec = {
                    name: name,
                    ext: this.extractFileExt(name),
                    size: size
                };
                filesSize += size;
                if (this.isFolder(fullName, rec)) {
                    rec.type = 'folder';
                    rec.icon = this.fileIcons['folder'];
                    folders.push(rec);
                } else {
                    rec.icon = this.fileIcons.hasOwnProperty(rec.ext) ? this.fileIcons[rec.ext] : this.fileIcons['file'];
                    if (rec.name === '__$$localstorage$$__') rec.icon = this.fileIcons['json'];
                    rec.type = this.getFileType(rec);
                    files.push(rec);
                }
            }
            folders.sort(this.cmpFileNames);
            files.sort(this.cmpFileNames);
        }
        result = {
            dir: [...folders, ...files],
            files: files.length,
            folders: folders.length - 1,
            filesSize: filesSize
        }
        this.cache[path] = result;
        return result;

    }

    cmpFileNames(a, b){
        const name1 = a.name.toLowerCase();
        const name2 = b.name.toLowerCase();
        if (name1 < name2) {
            return -1;
        }
        if (name1 > name2) {
            return 1;
        }
        return 0;
    }

    go(folder){
        this.path.push(folder);
    }

    back(){
        this.path.pop();
    }

    getFileType(rec){
        for (type in this.fileTypes){
            if (rec.name.match(this.fileTypes[type])){
                return type;
            }
        }
        return 'file';
    }

    isFolder(path, rec){
        if (rec.size == 0 /*&& rec.ext === ''*/){
            const dir = readdirSync({path: path});
            return dir !== undefined;
        }
        return false;
    }

    getFullPath(){
        const path = this.prefix.path + this.getPath();
        return path;
    }

    getPath(){
        const path = this.path.join('/');
        return path;
    }

    extractFileExt(file){
        const dotPos = file.lastIndexOf('.');
        return dotPos != -1 ? file.substring(dotPos + 1) : '';
    }

    getSizeStr(size){
        const designs = [getText('byte'), getText('kb'), getText('mb'), getText('gb')];
        for (const design of designs){
            if (size < 1024) return size + ' ' + design;
            size /= 1024;
            size = Math.round(size * 100) / 100;
        }
        return size + ' ' + designs[designs.length - 1];
    }

};