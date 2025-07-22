/**
 * GEFF validation utilities for validating GEFF metadata against the schema
 */

import Ajv from 'ajv';

// Initialize AJV validator
const ajv = new Ajv();

/**
 * Loads the GEFF schema from the local file
 * @returns {Promise<Object>} The GEFF schema object
 */
async function loadGeffSchema() {
    try {
        const response = await fetch('geff-schema.json');
        if (!response.ok) {
            throw new Error(`Failed to load schema: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading GEFF schema:', error);
        throw error;
    }
}

/**
 * Finds GEFF folders in the uploaded files by looking for .zattrs files with geff metadata
 * @param {File[]} files - Array of uploaded files
 * @returns {Promise<Object[]>} Array of GEFF folder objects with metadata
 */
export async function findGeffFolders(files) {
    const geffFolders = [];
    
    // Look for .zattrs files
    const zattrFiles = files.filter(file => {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        return path.endsWith('.zattrs');
    });
    
    // Process each .zattrs file
    for (const file of zattrFiles) {
        try {
            const content = await readFileAsText(file);
            const metadata = JSON.parse(content);
            
            // Check if it has a geff key
            if (metadata && metadata.geff) {
                const folderPath = extractFolderPath(file);
                geffFolders.push({
                    folderPath,
                    metadata: metadata.geff,
                    file: file,
                    fullMetadata: metadata
                });
            }
        } catch (error) {
            // Silently skip files that can't be parsed as JSON
        }
    }
    
    return geffFolders;
}

/**
 * Validates GEFF metadata against the schema
 * @param {Object} geffMetadata - The geff metadata object to validate
 * @param {Object} schema - The GEFF schema to validate against
 * @returns {Object} Validation result with isValid, errors, and details
 */
export function validateGeffMetadata(geffMetadata, schema) {
    try {
        // Wrap the geff metadata in the expected structure for validation
        const dataToValidate = { geff: geffMetadata };
        
        // Compile the schema
        const validate = ajv.compile(schema);
        
        // Validate the data
        const isValid = validate(dataToValidate);
        
        return {
            isValid,
            errors: validate.errors || [],
            metadata: geffMetadata,
            details: {
                version: geffMetadata.geff_version || 'Unknown',
                directed: geffMetadata.directed,
                axesCount: geffMetadata.axes ? geffMetadata.axes.length : 0,
                axes: geffMetadata.axes || []
            }
        };
    } catch (error) {
        return {
            isValid: false,
            errors: [{ message: `Validation error: ${error.message}` }],
            metadata: geffMetadata,
            details: {}
        };
    }
}

/**
 * Main function to validate all GEFF folders in uploaded files
 * @param {File[]} files - Array of uploaded files
 * @returns {Promise<Object>} Complete validation result
 */
export async function validateGeffFiles(files) {
    try {
        // Load the schema
        const schema = await loadGeffSchema();
        
        // Find GEFF folders
        const geffFolders = await findGeffFolders(files);
        
        if (geffFolders.length === 0) {
            // Check if this might be Safari skipping hidden files
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const hasDataFiles = files.some(file => {
                const path = file.webkitRelativePath || file.relativePath || file.name;
                return path.includes('values/') || path.includes('ids/');
            });
            
            let message = 'No GEFF folders found (no .zattrs files with geff metadata)';
            if (isSafari && hasDataFiles) {
                message = 'Safari may have skipped hidden files (.zattrs) - try using Chrome/Firefox or the browse button';
            }
            
            return {
                status: 'no-geff',
                message,
                geffFolders: [],
                validFolders: 0,
                totalFolders: 0
            };
        }
        
        // Validate each GEFF folder
        const validationResults = geffFolders.map(folder => ({
            ...folder,
            validation: validateGeffMetadata(folder.metadata, schema)
        }));
        
        const validFolders = validationResults.filter(result => result.validation.isValid);
        const invalidFolders = validationResults.filter(result => !result.validation.isValid);
        
        // Determine overall status
        let status, message;
        if (validFolders.length === geffFolders.length) {
            status = 'valid';
            message = `All ${geffFolders.length} GEFF folder(s) are valid`;
        } else if (validFolders.length > 0) {
            status = 'partial';
            message = `${validFolders.length} of ${geffFolders.length} GEFF folders are valid`;
        } else {
            status = 'invalid';
            message = `All ${geffFolders.length} GEFF folder(s) have validation errors`;
        }
        
        return {
            status,
            message,
            geffFolders: validationResults,
            validFolders: validFolders.length,
            totalFolders: geffFolders.length,
            schema
        };
    } catch (error) {
        return {
            status: 'error',
            message: `Validation failed: ${error.message}`,
            geffFolders: [],
            validFolders: 0,
            totalFolders: 0,
            error
        };
    }
}

/**
 * Helper function to read a file as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} The file content as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Extract the folder path from a file path
 * @param {File} file - The file object
 * @returns {string} The folder path containing the file
 */
function extractFolderPath(file) {
    const fullPath = file.webkitRelativePath || file.relativePath || file.name;
    const pathParts = fullPath.split('/');
    pathParts.pop(); // Remove the filename
    return pathParts.join('/');
}
