const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const miniprogramRoot = path.join(projectRoot, 'miniprogram');
const errors = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function parseJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${path.relative(projectRoot, filePath)}: ${error.message}`);
    return null;
  }
}

const projectConfig = parseJson(path.join(projectRoot, 'project.config.json'));
const appConfig = parseJson(path.join(miniprogramRoot, 'app.json'));

if (projectConfig && projectConfig.miniprogramRoot !== 'miniprogram/') {
  errors.push('project.config.json must point miniprogramRoot to miniprogram/');
}

walk(projectRoot)
  .filter((filePath) => filePath.endsWith('.json'))
  .forEach(parseJson);

walk(projectRoot)
  .filter((filePath) => filePath.endsWith('.js'))
  .forEach((filePath) => {
    try {
      new Function(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      errors.push(`${path.relative(projectRoot, filePath)}: ${error.message}`);
    }
  });

if (appConfig) {
  const pagePaths = appConfig.pages.slice();
  (appConfig.subPackages || []).forEach((subpackage) => {
    subpackage.pages.forEach((page) => pagePaths.push(`${subpackage.root}/${page}`));
  });

  pagePaths.forEach((pagePath) => {
    ['.js', '.json', '.wxml', '.wxss'].forEach((extension) => {
      const filePath = path.join(miniprogramRoot, `${pagePath}${extension}`);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing page file: ${path.relative(projectRoot, filePath)}`);
      }
    });
  });
}

const requestOwner = path.normalize('miniprogram/core/http/client.js');
walk(miniprogramRoot)
  .filter((filePath) => filePath.endsWith('.js'))
  .forEach((filePath) => {
    const relativePath = path.relative(projectRoot, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('wx.request') && path.normalize(relativePath) !== requestOwner) {
      errors.push(`wx.request must stay in ${requestOwner}: found in ${relativePath}`);
    }
  });

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('SoleMuse mini program structure is valid.');
}
