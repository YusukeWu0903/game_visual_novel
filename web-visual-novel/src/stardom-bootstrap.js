// Keep the imported module graph intact, including authored dynamic vendor imports.
const script = document.createElement('script');
script.type = 'module';
script.src = '/stardom/app.js';
document.head.append(script);
