import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.get("/", (req, res) => {
  res.send("License server online");
});

// 🔴 DIT IS WAT JIJ MIST
app.get("/check-key", async (req, res) => {
  const { key, hwid } = req.query;

  if (!key || !hwid) {
    return res.json({ valid: false, reason: "missing params" });
  }

  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", key)
    .single();

  if (!data) {
    return res.json({ valid: false, reason: "not found" });
  }

  if (!data.active) {
    return res.json({ valid: false, reason: "inactive" });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.json({ valid: false, reason: "expired" });
  }

  // HWID lock
  if (!data.hwid) {
    await supabase
      .from("licenses")
      .update({ hwid })
      .eq("id", data.id);
  } else if (data.hwid !== hwid) {
    return res.json({ valid: false, reason: "hwid mismatch" });
  }

  res.json({ valid: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
