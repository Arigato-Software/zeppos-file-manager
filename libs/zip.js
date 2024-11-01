export function parseZipFile(buffer) {
    const root = {};
    
    // Сигнатуры
    const eocdSignature = 0x06054b50;
    const centralDirSignature = 0x02014b50;

    // Ищем "End of Central Directory" (EOCD) с конца для ускорения
    const eocdIndex = findSignatureReverse(buffer, eocdSignature);
    if (eocdIndex === -1) {
        throw "End of Central Directory not found";
    }
    
    // Чтение смещения центрального каталога
    const centralDirOffset = buffer.getUint32(eocdIndex + 16, true);

    // Поиск файлов в центральном каталоге
    let index = centralDirOffset;
    while (index < buffer.byteLength) {
        if (buffer.getUint32(index, true) !== centralDirSignature) break;

        // Чтение длины имени файла
        const fileNameLength = buffer.getUint16(index + 28, true);

        // Чтение имени файла
        const fileNameBytes = Buffer.from(buffer.buffer, index + 46, fileNameLength);
        const fileName = fileNameBytes.toString('utf-8');
        addToTree(root, fileName);

        // Переход к следующей записи центрального каталога
        const extraFieldLength = buffer.getUint16(index + 30, true);
        const fileCommentLength = buffer.getUint16(index + 32, true);
        index += 46 + fileNameLength + extraFieldLength + fileCommentLength;
    }
    
    return root;
}

function findSignatureReverse(buffer, signature) {
    const length = buffer.byteLength;
    for (let i = length - 4; i >= 0; i--) {
        if (buffer.getUint32(i, true) === signature) return i;
    }
    return -1;
}

function addToTree(root, path) {
    const parts = path.split('/'); // Разделяем путь по папкам
    let current = root;

    parts.forEach((part, index) => {
        if (index === parts.length - 1) {
            if (part !== '') {
                // Это файл (последняя часть пути)
                current[part] = null; // Помечаем файл пустым значением или, при желании, информацией о файле
            }
        } else {
            // Это каталог
            if (!current[part]) {
                current[part] = {}; // Создаем каталог, если он не существует
            }
            current = current[part]; // Переходим на уровень ниже в дереве
        }
    });

}
