const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const targetPath = path.join(process.cwd(), 'generated', 'prisma', 'index.js');
const files = walk('src');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /from\s+['"]([^'"]*generated\/prisma[^'"]*)['"]/g;
    
    let modified = false;
    content = content.replace(regex, (match, p1) => {
        let relPath = path.relative(path.dirname(f), targetPath).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;
        modified = true;
        return `from "${relPath}"`;
    });

    if (modified) {
        fs.writeFileSync(f, content);
        console.log(`Updated ${f}`);
    }
});
