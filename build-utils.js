#!/usr/bin/env node
/**
 * Cross-platform build utilities for Windows and Unix
 */

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
    } else {
        console.warn(`Source file not found: ${src}`);
    }
}

function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`Source directory not found: ${src}`);
        return;
    }
    
    ensureDir(dest);
    const files = fs.readdirSync(src);
    
    files.forEach(file => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        const stat = fs.statSync(srcFile);
        
        if (stat.isDirectory()) {
            copyDir(srcFile, destFile);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    });
}

function copyFilesGlob(srcDir, pattern, destDir) {
    if (!fs.existsSync(srcDir)) {
        console.warn(`Source directory not found: ${srcDir}`);
        return;
    }
    
    ensureDir(destDir);
    const files = fs.readdirSync(srcDir);
    
    files.forEach(file => {
        // Simple glob support for *.ext
        if (pattern === '*' || file.endsWith(pattern.replace('*', ''))) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            const stat = fs.statSync(srcFile);
            
            if (stat.isFile()) {
                fs.copyFileSync(srcFile, destFile);
            }
        }
    });
}

module.exports = {
    ensureDir,
    removeDir,
    copyFile,
    copyDir,
    copyFilesGlob
};
