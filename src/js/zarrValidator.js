/**
 * Zarr validation utilities
 */

/**
 * Zarr validation utilities
 */

import { validateGeffFiles } from './geffValidator.js';

/**
 * Validates the structure of uploaded files to determine if they form a valid Zarr archive
 * @param {File[]} files - Array of uploaded files
 * @returns {Promise<Object>} Validation result with status, message, version, and counts
 */
export async function validateZarrStructure(files) {
    console.log('Validating zarr structure...');
    
    // First, run GEFF validation
    const geffValidation = await validateGeffFiles(files);
    
    // Look for zarr-specific files
    const hasZarrJson = files.some(file => 
        (file.name === '.zarray' || file.name === '.zgroup' || file.name === '.zattrs') ||
        (file.webkitRelativePath && file.webkitRelativePath.includes('.zarray')) ||
        (file.relativePath && file.relativePath.includes('.zarray'))
    );
    
    const hasZmetadata = files.some(file => 
        file.name === '.zmetadata' ||
        (file.webkitRelativePath && file.webkitRelativePath.includes('.zmetadata')) ||
        (file.relativePath && file.relativePath.includes('.zmetadata'))
    );
    
    // Count potential arrays and groups
    const zarrFiles = files.filter(file => {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        return path.includes('.zarray') || path.includes('.zgroup');
    });
    
    const arrayCount = files.filter(file => {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        return path.includes('.zarray');
    }).length;
    
    const groupCount = files.filter(file => {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        return path.includes('.zgroup');
    }).length;
    
    // Determine validation status based on both Zarr and GEFF validation
    let status, message, version = 'Unknown';
    
    if (geffValidation.status === 'valid') {
        status = 'valid';
        message = `Valid GEFF structure detected (${geffValidation.validFolders} folder(s))`;
        version = geffValidation.geffFolders[0]?.validation?.details?.version || 'Unknown';
    } else if (geffValidation.status === 'partial') {
        status = 'warning';
        message = geffValidation.message;
        version = geffValidation.geffFolders[0]?.validation?.details?.version || 'Unknown';
    } else if (geffValidation.status === 'no-geff') {
        // Use the specific message from GEFF validation (includes Safari detection)
        status = 'invalid';
        message = geffValidation.message;
        
        // Fall back to basic zarr validation if no specific message provided
        if (!message || message === 'No GEFF folders found (no .zattrs files with geff metadata)') {
            if (hasZarrJson || hasZmetadata) {
                status = 'warning';
                message = 'Valid Zarr structure detected, but no GEFF metadata found';
                version = hasZmetadata ? 'v2' : 'v3 (estimated)';
            } else if (zarrFiles.length > 0) {
                status = 'warning';
                message = 'Partial Zarr structure found - some metadata may be missing';
                version = 'Unknown';
            } else {
                message = 'No Zarr or GEFF structure detected in uploaded files';
            }
        }
    } else {
        status = 'invalid';
        message = geffValidation.message;
    }
    
    return {
        status,
        message,
        version,
        arrayCount,
        groupCount,
        geffValidation // Include detailed GEFF validation results
    };
}

/**
 * Extracts basic information about the uploaded folder
 * @param {File[]} files - Array of uploaded files
 * @returns {Object} Folder information including name, file count, and total size
 */
export function extractFolderInfo(files) {
    // Get the root folder name
    const firstFile = files[0];
    const rootPath = firstFile.webkitRelativePath || firstFile.relativePath || firstFile.name;
    const folderNameMatch = rootPath.split('/')[0];
    
    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
        name: folderNameMatch || 'Unknown',
        fileCount: files.length,
        totalSize: formatFileSize(totalSize)
    };
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
