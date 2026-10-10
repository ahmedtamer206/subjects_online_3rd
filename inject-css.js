const fs = require("fs");
const path = require("path");

const directory = __dirname;
const htmlFiles = fs.readdirSync(directory).filter((f) => f.endsWith(".html"));

const cssLink = '    <link rel="stylesheet" href="css/mobile-perf.css">';

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(path.join(directory, file), "utf8");

  // Skip if already injected
  if (content.includes("mobile-perf.css")) {
    console.log("Already injected: " + file);
    return;
  }

  // Inject before </head>
  if (content.includes("</head>")) {
    content = content.replace("</head>", cssLink + "\n</head>");
    fs.writeFileSync(path.join(directory, file), content);
    console.log("Injected CSS into: " + file);
  }
});
