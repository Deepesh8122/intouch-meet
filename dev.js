#!/usr/bin/env node
/**
 * Cross-platform development setup script
 * Handles file operations and runs webpack dev server
 */

const { ensureDir, removeDir, copyFile, copyDir, copyFilesGlob } = require('./build-utils');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DEPLOY_DIR = 'libs';
const BUILD_DIR = 'build';

// Determine file extension for bin scripts
const isWindows = process.platform === 'win32';
const scriptExt = isWindows ? '.cmd' : '';

function getCmdPath(script) {
    return path.join('node_modules', '.bin', script + scriptExt);
}

console.log('Setting up development environment...\n');

try {
    // 1. Initialize deploy directory
    console.log('1. Initializing libs directory...');
    removeDir(DEPLOY_DIR);
    ensureDir(DEPLOY_DIR);

    // 2. Deploy CSS
    console.log('2. Building CSS...');
    try {
        const sass = getCmdPath('sass');
        const cleancss = getCmdPath('cleancss');
        execSync(`${sass} css/main.scss css/all.bundle.css`, { stdio: 'inherit', shell: true });
        execSync(`${cleancss} --skip-rebase css/all.bundle.css > css/all.css`, { stdio: 'inherit', shell: true });
        if (fs.existsSync('css/all.bundle.css')) {
            fs.unlinkSync('css/all.bundle.css');
        }
    } catch (e) {
        console.warn('CSS build failed (this might be OK):', e.message);
    }

    // 3. Deploy rnnoise binary
    console.log('3. Deploying rnnoise binary...');
    copyFilesGlob('node_modules/@jitsi/rnnoise-wasm/dist', '*.wasm', DEPLOY_DIR);

    // 4. Deploy tflite
    console.log('4. Deploying tflite...');
    copyFilesGlob('react/features/stream-effects/virtual-background/vendor/tflite', '*.wasm', DEPLOY_DIR);

    // 5. Deploy meet models
    console.log('5. Deploying meet models...');
    copyFilesGlob('react/features/stream-effects/virtual-background/vendor/models', '*.tflite', DEPLOY_DIR);

    // 6. Deploy lib-jitsi-meet
    console.log('6. Deploying lib-jitsi-meet...');
    const libJitsiDir = 'node_modules/lib-jitsi-meet/dist/umd';
    if (fs.existsSync(libJitsiDir)) {
        copyFilesGlob(libJitsiDir, '*', DEPLOY_DIR);
    }

    // 7. Deploy OLM
    console.log('7. Deploying OLM...');
    const olmFile = 'node_modules/@matrix-org/olm/olm.wasm';
    if (fs.existsSync(olmFile)) {
        copyFile(olmFile, path.join(DEPLOY_DIR, 'olm.wasm'));
    }

    // 8. Deploy TensorFlow WASM
    console.log('8. Deploying TensorFlow WASM...');
    copyFilesGlob('node_modules/@tensorflow/tfjs-backend-wasm/dist', '*.wasm', DEPLOY_DIR);

    // 9. Deploy Excalidraw dev assets
    console.log('9. Deploying Excalidraw dev assets...');
    const excalidrawDev = 'node_modules/@jitsi/excalidraw/dist/excalidraw-assets-dev';
    if (fs.existsSync(excalidrawDev)) {
        copyDir(excalidrawDev, path.join(DEPLOY_DIR, 'excalidraw-assets-dev'));
    }

    // 10. Deploy face landmarks models
    console.log('10. Deploying face landmarks models...');
    const modelsDir = 'node_modules/@vladmandic/human-models/models';
    const faceModels = [
        'blazeface-front.bin',
        'blazeface-front.json',
        'emotion.bin',
        'emotion.json'
    ];
    if (fs.existsSync(modelsDir)) {
        faceModels.forEach(model => {
            const src = path.join(modelsDir, model);
            if (fs.existsSync(src)) {
                copyFile(src, path.join(DEPLOY_DIR, model));
            }
        });
    }

    console.log('\nDevelopment setup complete! Starting webpack dev server...\n');

    // Start webpack dev server
    const webpack = getCmdPath('webpack');
    
    execSync(`${webpack} serve --mode development --progress`, { 
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' }
    });

} catch (error) {
    console.error('Error during setup:', error.message);
    process.exit(1);
}
