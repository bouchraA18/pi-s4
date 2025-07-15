import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Card, CardContent, CardHeader, Typography, IconButton, CircularProgress,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button, Select,
  MenuItem, FormControl, InputLabel, Toolbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

export default function AdminAvis() {
  const token = localStorage.getItem("admin_token");
  const [avis, setAvis] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [etabFiltre, setEtabFiltre] = useState("");
  const [expandedAvis, setExpandedAvis] = useState({});

  const etablissements = [...new Set(avis.map((a) => a.etablissement?.nom ?? "—"))];

  const load = async () => {
    setBusy(true);
    try {
      const { data } = await axios.get("http://localhost:8000/api/admin/avis/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvis(data);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleComment = (id) => {
    setExpandedAvis((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const supprimerAvis = async (id) => {
    if (!window.confirm("Confirmer la suppression de cet avis ?")) return;
    await axios.delete(`http://localhost:8000/api/admin/avis/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
    setSelected(null);
  };

  const avisFiltres = etabFiltre
    ? avis.filter((a) => (a.etablissement?.nom ?? "—") === etabFiltre)
    : avis;

  const avisParEtab = avisFiltres.reduce((acc, a) => {
    const nom = a.etablissement?.nom ?? "—";
    if (!acc[nom]) acc[nom] = [];
    acc[nom].push(a);
    return acc;
  }, {});




const renderCardContent = (a, etabNom) => (
  <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
    {/* Commentaire */}
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        borderRadius: 2,
        px: 2,
        py: 1.5,
        mt: 2,
        border: "1px solid #e0e0e0",
        minHeight: 60,
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={1}>
        <ChatBubbleOutlineIcon sx={{ color: "action.active", mt: "3px" }} />
        <Box flexGrow={1}>
          {a.commentaire?.trim() ? (
            <>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  WebkitLineClamp: expandedAvis[a.id] ? "none" : 2,
                }}
              >
                {a.commentaire}
              </Typography>
              {a.commentaire.length > 100 && (
                <Button
                  onClick={() => toggleComment(a.id)}
                  size="small"
                  sx={{
                    mt: 1,
                    pl: 0,
                    textTransform: "none", // garde la casse normale
                    fontSize: "0.875rem",   // taille modérée
                    fontWeight: 500,        // ni trop fin ni trop gras
                    backgroundColor: "transparent", // pas de fond
                    boxShadow: "none",      // aucun effet
                    '&:hover': {
                      backgroundColor: "transparent", // pas d'effet au survol
                    },
                  }}
                >
                  {expandedAvis[a.id] ? "Voir moins" : "Voir plus"}
                </Button>
              )}
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "text.secondary" }}
            >
              (Aucun commentaire)
            </Typography>
          )}
        </Box>
      </Box>
    </Box>

    {/* Utilisateur */}
    <Box display="flex" alignItems="center" mt={2}>
      <PersonIcon sx={{ mr: 1 }} />
      <Typography variant="body2">
        {a.utilisateur?.nom ?? "Utilisateur inconnu"}
      </Typography>
    </Box>

    {/* Établissement */}
    <Box display="flex" alignItems="center" mt={1}>
      <SchoolIcon sx={{ mr: 1 }} />
      <Typography variant="body2" sx={{ color: "#1976d2", fontWeight: "bold" }}>
        {etabNom ?? a.etablissement?.nom ?? "Établissement non précisé"}
      </Typography>
    </Box>
  </CardContent>
);


  return (
    <Box sx={{ mb: 4 }}>
      <Toolbar />
      {/* Filtrage */}
      <FormControl sx={{ mb: 4, minWidth: 250 }}>
        <InputLabel sx={{ color: "#1976d2" }}>Filtrer par établissement</InputLabel>
        <Select
          value={etabFiltre}
          label="Filtrer par établissement"
          onChange={(e) => setEtabFiltre(e.target.value)}
        >
          <MenuItem value="">Tous les établissements</MenuItem>
          {etablissements.map((nom, index) => (
            <MenuItem key={index} value={nom}>
              {nom}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Affichage */}
      {busy ? (
        <CircularProgress />
      ) : avisFiltres.length === 0 ? (
        <Typography>Aucun avis trouvé pour cet établissement.</Typography>
      ) : etabFiltre === "" ? (
        <Grid container spacing={3}>
          {[...avisFiltres]
            .sort((a, b) =>
              (a.etablissement?.nom ?? "").localeCompare(b.etablissement?.nom ?? "")
            )
            .map((a) => (
              <Grid item xs={12} sm={4} lg={3} key={a.id}>
                <Card elevation={4} sx={{ width: 300, margin: "auto" }}>
                  <CardHeader
                    title={
                      <Box display="flex" alignItems="center" gap={1}>
                        <StarIcon sx={{ color: "orange" }} />
                        <Typography variant="h6">{a.note}/5</Typography>
                      </Box>
                    }
                    subheader={
                      <Typography variant="body2" sx={{ color: "#1976d2" }}>
                        {new Date(a.date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    }
                    action={
                      <IconButton onClick={() => setSelected(a)}>
                        <DeleteIcon sx={{ color: "red" }} />
                      </IconButton>
                    }
                  />
                  {renderCardContent(a)}
                </Card>
              </Grid>
            ))}
        </Grid>
      ) : (
        Object.entries(avisParEtab).map(([etabNom, avisList]) => (
          <Box key={etabNom} sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {etabNom} ({avisList.length} avis)
            </Typography>
            <Grid container spacing={3}>
              {avisList.map((a) => (
                <Grid item xs={12} sm={4} lg={3} key={a.id}>
                  <Card elevation={4} sx={{ width: 300, margin: "auto" }}>
                    <CardHeader
                      title={
                        <Box display="flex" alignItems="center" gap={1}>
                          <StarIcon sx={{ color: "orange" }} />
                          <Typography variant="h6">{a.note}/5</Typography>
                        </Box>
                      }
                      subheader={
                        <Typography variant="body2" sx={{ color: "#1976d2" }}>
                          {new Date(a.date).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      }
                      action={
                        <IconButton onClick={() => setSelected(a)}>
                          <DeleteIcon sx={{ color: "red" }} />
                        </IconButton>
                      }
                    />
                    {renderCardContent(a, etabNom)}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {/* Boîte de dialogue suppression */}
      <Dialog open={!!selected} onClose={() => setSelected(null)}>
        <DialogTitle>Supprimer l'avis</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer l'avis de{" "}
            <strong>{selected?.utilisateur?.nom}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => supprimerAvis(selected.id)}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
