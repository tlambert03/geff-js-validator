/**
 * File tree utilities for displaying folder structure
 */

/**
 * Creates a hierarchical tree structure from flat file list
 * @param {File[]} files - Array of files
 * @returns {Object} Tree structure object
 */
export function createFileTree(files) {
    const tree = {};
    
    files.forEach(file => {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        const parts = path.split('/');
        
        let current = tree;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = i === parts.length - 1 ? null : {};
            }
            if (current[part] !== null) {
                current = current[part];
            }
        }
    });
    
    return tree;
}

/**
 * Renders file tree as HTML
 * @param {Object} tree - Tree structure object
 * @param {number} indent - Current indentation level
 * @returns {string} HTML string representation of the tree
 */
export function renderFileTree(tree, indent = 0) {
    let html = '';
    const entries = Object.entries(tree).sort(([a, aValue], [b, bValue]) => {
        // Directories first, then files
        if (aValue === null && bValue !== null) return 1;
        if (aValue !== null && bValue === null) return -1;
        return a.localeCompare(b);
    });
    
    entries.forEach(([name, value]) => {
        const isFile = value === null;
        const className = isFile ? 'file' : 'folder';
        const icon = isFile ? '📄' : '📁';
        const indentStr = '  '.repeat(indent);
        
        html += `<div class="file-tree-item ${className}">${indentStr}${icon} ${name}</div>`;
        
        if (!isFile && Object.keys(value).length > 0) {
            html += renderFileTree(value, indent + 1);
        }
    });
    
    return html;
}
