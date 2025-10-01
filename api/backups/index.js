const { getAdmin } = require("../_lib/supabaseAdmin");

module.exports = async (req, res) => {
  try {
    const supa = getAdmin();
    const { data, error } = await supa
      .from("backups")
      .select("key,table_name")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const out = { trucks: [], trailers: [], expenses: [], repairs: [], invoices: [] };
    for (const r of data || []) if (out[r.table_name]) out[r.table_name].push(r.key);

    return res.status(200).json({ ok: true, backups: out });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
