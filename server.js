import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import sanitize from "sanitize-filename";

const app = express();
const PORT = 3000;
const archivesDir = path.join(process.cwd(), "archives");

// Ensure archives folder exists
if (!fs.existsSync(archivesDir)) {
  fs.mkdirSync(archivesDir);
}

app.use(express.urlencoded({ extended: true }));

// Form page
app.get("/", (req, res) => {
  res.send(`
    <h1>URL Archiver</h1>
    <form method="POST" action="/archive">
      <input type="text" name="url" placeholder="https://example.com" style="width:300px" required />
      <button type="submit">Archive</button>
    </form>
  `);
});

// Archive handler
app.post("/archive", async (req, res) => {
  const url = req.body.url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return res.send("❌ URL must start with http:// or https://");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const html = await response.text();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = sanitize(new URL(url).hostname + "-" + timestamp) + ".html";
    const savePath = path.join(archivesDir, safeName);

    fs.writeFileSync(savePath, html, "utf-8");
    res.send(`✅ Archived <a href="${url}">${url}</a> to <code>${savePath}</code>`);
  } catch (err) {
    console.error(err);
    res.send("❌ Failed to archive: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
