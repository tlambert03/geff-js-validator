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
    console.log(`🗂️ TRAVERSE: Traversing "${entry.name}" (isFile: ${entry.isFile}, isDirectory: ${entry.isDirectory})`);
    
    return new Promise((resolve) => {
        const files = [];
        
        if (entry.isFile) {
            console.log(`📄 Processing file: ${entry.name}`);
            entry.file((file) => {
                file.relativePath = path + file.name;
                console.log(`✅ File added: ${file.relativePath} (${file.size} bytes)`);
                files.push(file);
                resolve(files);
            }, (error) => {
                console.error(`❌ Error reading file ${entry.name}:`, error);
                resolve(files);
            });
        } else if (entry.isDirectory) {
            console.log(`📁 Processing directory: ${entry.name}`);
            const dirReader = entry.createReader();
            dirReader.readEntries(async (entries) => {
                console.log(`📁 Directory "${entry.name}" contains ${entries.length} entries`);
                
                for (const childEntry of entries) {
                    const childFiles = await traverseDirectory(childEntry, path + entry.name + '/');
                    files.push(...childFiles);
                }
                
                console.log(`📁 Directory "${entry.name}" processing complete: ${files.length} files total`);
                resolve(files);
            }, (error) => {
                console.error(`❌ Error reading directory ${entry.name}:`, error);
                resolve(files);
            });
        }
    });
}

/**
 * Handles DataTransfer items from drag and drop events
 * @param {DataTransferItemList} items - Items from drag event
 * on@returns {Promise<File[]>} Promise resolving to array of files
 */
export async function handleDataTransferItems(items) {
    console.log('🔧 FILEHANDLER: Processing DataTransfer items...');
    console.log('📊 Items received:', items.length);
    
    const files = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`🔍 Item ${i + 1}:`, {
            kind: item.kind,
            type: item.type,
            hasWebkitGetAsEntry: 'webkitGetAsEntry' in item
        });
        
        if (item.kind === 'file') {
            console.log('📁 Processing file item...');
            
            if ('webkitGetAsEntry' in item) {
                console.log('✅ Browser supports webkitGetAsEntry');
                const entry = item.webkitGetAsEntry();
                console.log('📁 Entry:', entry);
                
                if (entry) {
                    console.log('📁 Entry details:', {
                        name: entry.name,
                        isFile: entry.isFile,
                        isDirectory: entry.isDirectory
                    });
                    
                    const entryFiles = await traverseDirectory(entry);
                    console.log(`📄 Files from entry "${entry.name}":`, entryFiles.length);
                    files.push(...entryFiles);
                } else {
                    console.log('❌ Entry is null');
                }
            } else {
                console.log('❌ Browser does not support webkitGetAsEntry');
            }
        } else {
            console.log('⏭️ Skipping non-file item');
        }
    }
    
    console.log('📋 FILEHANDLER: Total files extracted:', files.length);
    return files;
}
