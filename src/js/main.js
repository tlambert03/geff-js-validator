import { validateZarrStructure, extractFolderInfo } from './zarrValidator.js';
import { createFileTree, renderFileTree } from './fileTree.js';
import { handleDataTransferItems } from './fileHandler.js';

// Browser detection
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const results = document.getElementById('results');
const clearBtn = document.getElementById('clear-btn');

// Results elements
const validationStatus = document.getElementById('validation-status');
const statusIndicator = document.getElementById('status-indicator');
const statusMessage = document.getElementById('status-message');
const folderName = document.getElementById('folder-name');
const fileCount = document.getElementById('file-count');
const folderSize = document.getElementById('folder-size');
const zarrVersion = document.getElementById('zarr-version');
const arrayCount = document.getElementById('array-count');
const groupCount = document.getElementById('group-count');
const fileTree = document.getElementById('file-tree');

// GEFF elements
const geffFolders = document.getElementById('geff-folders');
const validGeffFolders = document.getElementById('valid-geff-folders');
const geffVersion = document.getElementById('geff-version');
const geffDetails = document.getElementById('geff-details');
const geffValidationDetails = document.getElementById('geff-validation-details');

// Initialize the application
function initializeApp() {
    if (isSafari) {
        showSafariNotSupported();
        return;
    }
    
    setupEventListeners();
}

function showSafariNotSupported() {
    dropzone.innerHTML = `
        <div class="safari-not-supported">
            <div class="browser-icon">🚫</div>
            <h2>Safari Not Supported</h2>
            <p>This Zarr validator requires access to hidden files (like .zattrs) which Safari restricts for security reasons.</p>
            <div class="supported-browsers">
                <h3>Please use one of these browsers:</h3>
                <div class="browser-list">
                    <div class="browser-item">
                        <span class="browser-emoji">🌐</span>
                        <span>Chrome</span>
                    </div>
                    <div class="browser-item">
                        <span class="browser-emoji">🦊</span>
                        <span>Firefox</span>
                    </div>
                    <div class="browser-item">
                        <span class="browser-emoji">🔷</span>
                        <span>Edge</span>
                    </div>
                </div>
            </div>
            <p class="technical-note">
                <strong>Technical note:</strong> Safari doesn't include hidden files (.zattrs, .zgroup) 
                in drag & drop operations, which are essential for Zarr validation.
            </p>
        </div>
    `;
    dropzone.classList.add('safari-blocked');
}

function setupEventListeners() {
    // Event Listeners
    dropzone.addEventListener('click', () => fileInput.click());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelection);
    clearBtn.addEventListener('click', clearResults);

    // Drag and Drop Events
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
}

function handleDragOver(e) {
    e.preventDefault();
    dropzone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    
    const items = e.dataTransfer.items;
    if (items) {
        handleDroppedItems(items);
    }
}

async function handleDroppedItems(items) {
    const files = await handleDataTransferItems(items);
    
    if (files.length > 0) {
        processFiles(files);
    }
}

function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
        processFiles(files);
    }
}

async function processFiles(files) {
    // Extract folder information
    const folderInfo = extractFolderInfo(files);
    
    // Validate zarr structure (now async)
    const validationResult = await validateZarrStructure(files);
    
    // Display results
    displayResults(folderInfo, validationResult, files);
}

function displayResults(folderInfo, validationResult, files) {
    // Show results section
    results.classList.remove('hidden');
    
    // Update status
    statusIndicator.className = `status-indicator ${validationResult.status}`;
    statusMessage.textContent = validationResult.message;
    
    // Update folder info
    folderName.textContent = folderInfo.name;
    fileCount.textContent = folderInfo.fileCount;
    folderSize.textContent = folderInfo.totalSize;
    
    // Update zarr info
    zarrVersion.textContent = validationResult.version;
    arrayCount.textContent = validationResult.arrayCount;
    groupCount.textContent = validationResult.groupCount;
    
    // Update GEFF info
    const geffValidation = validationResult.geffValidation;
    if (geffValidation) {
        geffFolders.textContent = geffValidation.totalFolders;
        validGeffFolders.textContent = geffValidation.validFolders;
        
        // Show GEFF version from the first valid folder
        const firstValidFolder = geffValidation.geffFolders.find(f => f.validation.isValid);
        if (firstValidFolder) {
            geffVersion.textContent = firstValidFolder.validation.details.version || 'Unknown';
        } else {
            geffVersion.textContent = 'N/A';
        }
        
        // Show detailed GEFF validation if there are GEFF folders
        if (geffValidation.totalFolders > 0) {
            displayGeffDetails(geffValidation);
            geffDetails.style.display = 'block';
        } else {
            geffDetails.style.display = 'none';
        }
    } else {
        geffFolders.textContent = '0';
        validGeffFolders.textContent = '0';
        geffVersion.textContent = 'N/A';
        geffDetails.style.display = 'none';
    }
    
    // Update file tree
    displayFileTree(files);
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth' });
}

function displayFileTree(files) {
    // Create a simplified file tree view
    const tree = createFileTree(files);
    fileTree.innerHTML = renderFileTree(tree);
}

function displayGeffDetails(geffValidation) {
    let html = '';
    
    geffValidation.geffFolders.forEach(folder => {
        const isValid = folder.validation.isValid;
        const className = isValid ? 'valid' : 'invalid';
        
        html += `<div class="geff-folder ${className}">`;
        html += `<div class="geff-folder-path">📁 ${folder.folderPath}</div>`;
        
        if (isValid) {
            html += `<div><strong>✅ Valid GEFF metadata</strong></div>`;
            const details = folder.validation.details;
            html += `<div>Version: ${details.version}</div>`;
            html += `<div>Directed: ${details.directed}</div>`;
            html += `<div>Axes: ${details.axesCount}</div>`;
            
            if (details.axes && details.axes.length > 0) {
                html += `<div class="geff-axes">`;
                details.axes.forEach(axis => {
                    html += `<div class="geff-axis">`;
                    html += `<strong>${axis.name}</strong> (${axis.type || 'no type'})`;
                    if (axis.min !== null && axis.max !== null) {
                        html += ` - Range: ${axis.min} to ${axis.max}`;
                    }
                    if (axis.unit) {
                        html += ` - Unit: ${axis.unit}`;
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            }
        } else {
            html += `<div><strong>❌ Invalid GEFF metadata</strong></div>`;
            if (folder.validation.errors && folder.validation.errors.length > 0) {
                html += `<div class="geff-errors">`;
                html += `<strong>Errors:</strong><br>`;
                folder.validation.errors.forEach(error => {
                    html += `• ${error.instancePath || '/'}: ${error.message}<br>`;
                });
                html += `</div>`;
            }
        }
        
        html += `</div>`;
    });
    
    geffValidationDetails.innerHTML = html;
}

function clearResults() {
    results.classList.add('hidden');
    fileInput.value = '';
    
    // Reset all values
    statusIndicator.className = 'status-indicator';
    statusMessage.textContent = '';
    folderName.textContent = '';
    fileCount.textContent = '';
    folderSize.textContent = '';
    zarrVersion.textContent = '';
    arrayCount.textContent = '';
    groupCount.textContent = '';
    fileTree.innerHTML = '';
    
    // Reset GEFF values
    geffFolders.textContent = '';
    validGeffFolders.textContent = '';
    geffVersion.textContent = '';
    geffValidationDetails.innerHTML = '';
    geffDetails.style.display = 'none';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
