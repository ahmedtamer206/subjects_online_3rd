const fs = require("fs");
const path = require("path");

const directory = __dirname;
const htmlFiles = fs.readdirSync(directory).filter((f) => f.endsWith(".html"));

const scriptsToInject = `
    <!-- Firebase SDK & Sync -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/sync.js"></script>
`;

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(path.join(directory, file), "utf8");

  // Remove existing firebase scripts to prevent duplicates
  content = content.replace(
    /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/.*"><\/script>\n/g,
    "",
  );
  content = content.replace(
    /<script src="js\/firebase-config\.js"><\/script>\n?/g,
    "",
  );
  content = content.replace(/<script src="js\/auth\.js"><\/script>\n?/g, "");
  content = content.replace(/<script src="js\/sync\.js"><\/script>\n?/g, "");
  content = content.replace(/<!-- Firebase SDK \(compat\) -->\n?/g, "");
  content = content.replace(/<!-- Firebase SDK & Sync -->\n?/g, "");
  content = content.replace(/<!-- Project Config & Auth Module -->\n?/g, "");

  // Inject before the first custom js file or before </body>
  if (content.includes('<script src="js/shared-nav.js"></script>')) {
    content = content.replace(
      '<script src="js/shared-nav.js"></script>',
      scriptsToInject.trim() + '\n    <script src="js/shared-nav.js"></script>',
    );
  } else if (content.includes('<script src="js/login.js"></script>')) {
    content = content.replace(
      '<script src="js/login.js"></script>',
      scriptsToInject.trim() + '\n    <script src="js/login.js"></script>',
    );
  } else if (content.includes("</body>")) {
    content = content.replace("</body>", scriptsToInject.trim() + "\n</body>");
  }

  fs.writeFileSync(path.join(directory, file), content);
  console.log("Injected into " + file);
});
