import fs from 'fs';
let content = fs.readFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/index.html', 'utf-8');
if (!content.includes('window.global')) {
    content = content.replace('<head>', '<head>\n    <script>window.global = window;</script>');
    fs.writeFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/index.html', content);
    console.log("patched index.html");
}
