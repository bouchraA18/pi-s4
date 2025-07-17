/* src/pages/AdminEtablissements.jsx
   ————————————————————————————————————————————————————————— */
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Tabs, Tab, Typography,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Stack, Fade
} from "@mui/material";

/* helper: coloured chip for validate = True / False / null */
const StatusChip = ({ v }) => {
  const label = v === true ? "approuvé" : v === false ? "rejeté" : "en attente";
  const color = v === true ? "success" : v === false ? "error" : "warning";
  return <Chip size="small" label={label} color={color} />;
};

/* image or PDF preview -- downloads if the browser can’t embed it */
const Preview = ({ data }) => {
  if (!data) return "—";
  if (data.startsWith("data:application/pdf"))
    return (
      <object data={data} type="application/pdf" width="100%" height={280}>
        <a href={data} download="autorisation.pdf">Télécharger le PDF</a>
      </object>
    );
  return (
    <img
      src={data}
      alt="autorisation"
      style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 4 }}
    />
  );
};

export default function AdminEtablissements() {
  const token = localStorage.getItem("admin_token");
  const [tab, setTab]     = useState("pending");    // "pending" | "approved" | "rejected"
  const [rows, setRows]   = useState([]);
  const [busy, setBusy]   = useState(false);
  const [dlg, setDlg]     = useState({ open: false, row: null });

  /* ── load list for current tab ───────────────────────── */
  const load = async () => {
    setBusy(true);
    try {
      const { data } = await axios.get(
        `http://localhost:8000/api/admin/etablissements/?status=${tab}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRows(data);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  /* ── open dialog, fetch PDF/image preview if needed ──── */
  const openRow = async (r) => {
    setDlg({ open: true, row: r });
    if (!r.autorisation_id) return;
    try {
      const { data } = await axios.get(
        `http://localhost:8000/api/admin/autorisation/${r.autorisation_id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDlg({ open: true, row: { ...r, preview: data.data } });
    } catch { /* silent */ }
  };

  /* ── approve / reject actions ───────────────────────── */
  const act = async (ok) => {
    await axios.put(
      `http://localhost:8000/api/admin/etablissements/${dlg.row.id}/${ok ? "approve" : "reject"}/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setDlg({ open: false, row: null });
    load();
  };

  /* ── render ─────────────────────────────────────────── */
  return (
    <Fade in timeout={400}>
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Gestion des établissements</Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="pending"  label="En attente" />
          <Tab value="approved" label="Approuvés" />
          <Tab value="rejected" label="Rejetés" />
        </Tabs>

        {busy ? (
          <CircularProgress />
        ) : (
          <Paper elevation={3} sx={{ overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ "& th": { background: "#e2ecff", fontWeight: 600 } }}>
                  <TableRow>
                    <TableCell sx={{ width: "30%" }}>Nom</TableCell>
                    <TableCell sx={{ width: "20%" }}>Ville</TableCell>
                    <TableCell sx={{ width: "20%" }}>Niveau</TableCell>
                    <TableCell sx={{ width: "15%" }}>Statut</TableCell>
                    <TableCell sx={{ width: "15%" }}>Téléphone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.id}
                      hover
                      sx={{
                        height: 76,
                        cursor: "pointer",
                        "&:nth-of-type(odd)": { background: "#fafbfd" },
                      }}
                      onClick={() => openRow(r)}
                    >
                      <TableCell>{r.nom}</TableCell>
                      <TableCell>{r.ville || "—"}</TableCell>
                      <TableCell>{r.niveau || "—"}</TableCell>
                      <TableCell><StatusChip v={r.validate} /></TableCell>
                      <TableCell>{r.telephone || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* ── modal ─────────────────────────────────────── */}
        <Dialog
          open={dlg.open}
          onClose={() => setDlg({ open: false, row: null })}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
        >
          {dlg.row && (
            <>
              <DialogTitle sx={{ bgcolor: "#002D6B", color: "#fff", px: 4, py: 2 }}>
                {dlg.row.nom}
              </DialogTitle>

              <DialogContent dividers sx={{ px: 4, py: 3, bgcolor: "grey.50" }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1"><b>Ville&nbsp;:</b> {dlg.row.ville || "—"}</Typography>
                  <Typography variant="subtitle1"><b>Niveau&nbsp;:</b> {dlg.row.niveau || "—"}</Typography>
                  <Typography variant="subtitle1"><b>Type&nbsp;:</b> {dlg.row.type === "privée" ? "Privé" : "Public"}</Typography>
                  <Typography variant="subtitle1"><b>Téléphone&nbsp;:</b> {dlg.row.telephone || "—"}</Typography>
                  {dlg.row.site && (
                    <Typography variant="subtitle1">
                      <b>Site&nbsp;:</b>{" "}
                      <a href={dlg.row.site} target="_blank" rel="noreferrer">{dlg.row.site}</a>
                    </Typography>
                  )}
                  <Typography variant="body1">
                    <b>Description&nbsp;:</b>
                    <Box component="div" sx={{ mt: 1, pl: 1 }}>{dlg.row.description || "—"}</Box>
                  </Typography>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Autorisation&nbsp;:
                    </Typography>
                    <Box sx={{ borderRadius: 2, border: 1, borderColor: "divider", p: 2, bgcolor: "#fff" }}>
                      <Preview data={dlg.row.preview} />
                    </Box>
                  </Box>
                </Stack>
              </DialogContent>

              <DialogActions sx={{ px: 4, py: 2, bgcolor: "grey.100", justifyContent: "space-between" }}>
                {tab === "pending" ? (
                  <Box>
                    <Button variant="contained" color="success" onClick={() => act(true)} sx={{ mr: 1 }}>
                      Valider
                    </Button>
                    <Button variant="contained" color="error" onClick={() => act(false)}>
                      Rejeter
                    </Button>
                  </Box>
                ) : (
                  <StatusChip v={dlg.row.validate} />
                )}
                <Button variant="outlined" onClick={() => setDlg({ open: false, row: null })}>
                  Fermer
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Fade>
  );
}
