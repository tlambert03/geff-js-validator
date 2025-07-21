/**
 * File handling utilities for drag and drop operations
 */

/**
 * Traverses a directory entry recursively to get all files
 * @param {FileSystemEntry} entry - Directory or file entry
 * @param {string} path - Current path prefix
 * @returns {Promise<File[]>} Promise resolving to array of files
 */
export function traverseDirectory(entry, path = '') {
    return new Promise((resolve) => {
        const files = [];
        
        if (entry.isFile) {
            entry.file((file) => {
                file.relativePath = path + file.name;
                files.push(file);
                resolve(files);
            }, (error) => {
                console.error(`Error reading file ${entry.name}:`, error);
                resolve(files);
            });
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            dirReader.readEntries(async (entries) => {
                for (const childEntry of entries) {
                    const childFiles = await traverseDirectory(childEntry, path + entry.name + '/');
                    files.push(...childFiles);
                }
                
                resolve(files);
            }, (error) => {
                console.error(`Error reading directory ${entry.name}:`, error);
                resolve(files);
            });
        }
    });
}

/**
 * Handles DataTransfer items from drag and drop events
 * @param {DataTransferItemList} items - Items from drag event
 * @returns {Promise<File[]>} Promise resolving to array of files
 */
export async function handleDataTransferItems(items) {
    const files = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.kind === 'file') {
            if ('webkitGetAsEntry' in item) {
                const entry = item.webkitGetAsEntry();
                
                if (entry) {
                    const entryFiles = await traverseDirectory(entry);
                    files.push(...entryFiles);
                }
            }
        }
    }
    
    return files;
}
