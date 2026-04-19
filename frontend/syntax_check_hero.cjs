const fs = require('fs');
const { parse } = require('@babel/parser');
const content = fs.readFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/landing/Hero.jsx', 'utf8');

try {
  parse(content, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log("Parse success!");
} catch (e) {
  console.log(e.message);
}
