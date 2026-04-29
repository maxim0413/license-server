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

// test root
app.get("/", (req, res) => {
  res.send("License server online");
});

// 🔥 BELANGRIJK: jouw key route
app.get("/check-key", async (req, res) => {
  const { key, hwid } = req.query;

  if (!key || !hwid) return res.send("missing");

  const { data: license, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", key)
    .single();

  if (error || !license) return res.send("invalid");
  if (!license.active) return res.send("invalid");

  // HWID lock
  if (!license.hwid) {
    await supabase
      .from("licenses")
      .update({ hwid })
      .eq("license_key", key);

    return res.send("valid");
  }

  if (license.hwid !== hwid) return res.send("invalid");

  return res.send("valid");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
