const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/opt/build/repo/*.html');
// We don't need to rewrite all HTML files if we do it in dashboard.js.
// Actually, it's better to remove the hardcoded menu from all HTMLs so there is no flash of unhidden content.
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // replace <nav ...> ... </nav> with <nav class="bottom_left_container"><ul id="sidebar-menu"></ul></nav>
  // wait, some files have <nav class="bottom_left_container">, inside it is <ul>, and then maybe other things?
});
