const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.post("/check-key", async (req, res) => {
  const { key, hwid } = req.body;

  if (!key || !hwid) {
    return res.json({ valid: false, message: "Missing data" });
  }

  const { data: license } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", key)
    .single();

  if (!license) {
    return res.json({ valid: false, message: "Invalid key" });
  }

  if (!license.active) {
    return res.json({ valid: false, message: "Key disabled" });
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return res.json({ valid: false, message: "Key expired" });
  }

  if (!license.hwid) {
    await supabase
      .from("licenses")
      .update({ hwid })
      .eq("license_key", key);

    return res.json({ valid: true, message: "Activated" });
  }

  if (license.hwid !== hwid) {
    return res.json({ valid: false, message: "Used on another PC" });
  }

  return res.json({ valid: true, message: "Valid" });
});

app.get("/", (req, res) => {
  res.send("License server online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
