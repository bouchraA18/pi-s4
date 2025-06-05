import React,{useEffect,useState} from "react";
import axios from "axios";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Paper, Tabs, Tab, Typography, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Stack, Fade
} from "@mui/material";

const StatusChip = v => <Chip size="small" label={v?"approuvé":"en attente / rejeté"} color={v?"success":"warning"}/>;

const Preview = ({data})=>{
  if(!data) return "—";
  if(data.startsWith("data:application/pdf"))
    return <embed src={data} type="application/pdf" width="100%" height="280"/>;
  return <img src={data} alt="autorisation" style={{maxWidth:"100%",maxHeight:280,borderRadius:4}}/>;
};

export default function AdminEtablissements(){
  const token=localStorage.getItem("admin_token");
  const [tab,setTab]=useState("pending");
  const [rows,setRows]=useState([]);
  const [busy,setBusy]=useState(false);
  const [dlg,setDlg]=useState({open:false,row:null});

  const load=async()=>{
    setBusy(true);
    try{
      const {data}=await axios.get(
        `http://localhost:8000/api/admin/etablissements/?status=${tab}`,
        {headers:{Authorization:`Bearer ${token}`}}
      );
      setRows(data);
    }finally{setBusy(false);}
  };
  useEffect(()=>{load();},[tab]);

  const openRow=async r=>{
    setDlg({open:true,row:r});
    if(!r.autorisation_id) return;
    try{
      const {data}=await axios.get(
        `http://localhost:8000/api/admin/autorisation/${r.autorisation_id}/`,
        {headers:{Authorization:`Bearer ${token}`}}
      );
      setDlg({open:true,row:{...r,preview:data.data}});
    }catch{}
  };

  const act=async ok=>{
    await axios.put(
      `http://localhost:8000/api/admin/etablissements/${dlg.row.id}/${ok?"approve":"reject"}/`,
      {},{headers:{Authorization:`Bearer ${token}`}}
    );
    setDlg({open:false,row:null});
    load();
  };

  /* ------ UI ------ */
  return(
    <Fade in timeout={400}>
      <Box>
        <Typography variant="h5" sx={{mb:3}}>Gestion des établissements</Typography>

        <Tabs value={tab} onChange={(e,v)=>setTab(v)} sx={{mb:2}}>
          <Tab value="pending"  label="En attente"/>
          <Tab value="approved" label="Approuvés"/>
          <Tab value="rejected" label="Rejetés"/>
        </Tabs>

        {busy ? <CircularProgress/> : (
          <Paper elevation={3} sx={{ maxWidth:"100%", overflow:"hidden" }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ "& th":{ background:"#e2ecff", fontWeight:600 } }}>
                  <TableRow>
                    <TableCell sx={{width:"35%"}}>Nom</TableCell>
                    <TableCell sx={{width:"25%"}}>Ville</TableCell>
                    <TableCell sx={{width:"20%"}}>Niveau</TableCell>
                    <TableCell sx={{width:"20%"}}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(r=>(
                    <TableRow key={r.id} hover sx={{
                      height:80,
                      cursor:"pointer",
                      "&:nth-of-type(odd)":{ background:"#fafbfd" }
                    }} onClick={()=>openRow(r)}>
                      <TableCell>{r.nom}</TableCell>
                      <TableCell>{r.ville??"—"}</TableCell>
                      <TableCell>{r.niveau??"—"}</TableCell>
                      <TableCell><StatusChip v={r.validate}/></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* --- Modal --- */}
         <Dialog
          open={dlg.open}
          onClose={() => setDlg({ open: false, row: null })}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: (theme) => theme.shadows[20],
              overflow: "hidden",
            },
          }}
        >
          {dlg.row && (
            <>
              <DialogTitle
                sx={{
                  backgroundColor: "#002D6B",
                  color: (theme) => theme.palette.primary.contrastText,
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  px: 4,
                  py: 2,
                }}
              >
                {dlg.row.nom}
              </DialogTitle>

              <DialogContent
                dividers
                sx={{
                  backgroundColor: (theme) => theme.palette.grey[50],
                  px: 4,
                  py: 3,
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      Ville&nbsp;:
                    </Box>{" "}
                    {dlg.row.ville ?? "—"}
                  </Typography>

                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      Niveau&nbsp;:
                    </Box>{" "}
                    {dlg.row.niveau ?? "—"}
                  </Typography>

                  <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      Description&nbsp;:
                    </Box>
                    <Box component="div" sx={{ mt: 1, pl: 1 }}>
                      {dlg.row.description}
                    </Box>
                  </Typography>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Autorisation&nbsp;:
                    </Typography>
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        p: 2,
                        bgcolor: (theme) => theme.palette.common.white,
                      }}
                    >
                      <Preview data={dlg.row.preview} />
                    </Box>
                  </Box>
                </Stack>
              </DialogContent>

              <DialogActions
                sx={{
                  backgroundColor: (theme) => theme.palette.grey[100],
                  px: 4,
                  py: 2,
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  {tab === "pending" ? (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => act(true)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          boxShadow: (theme) => theme.shadows[3],
                        }}
                      >
                        Valider
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => act(false)}
                        sx={{
                          ml: 2,
                          textTransform: "none",
                          fontWeight: 500,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          boxShadow: (theme) => theme.shadows[3],
                        }}
                      >
                        Rejeter
                      </Button>
                    </>
                  ) : (
                    <Chip
                      label={tab === "approved" ? "approuvé" : "rejeté"}
                      color={tab === "approved" ? "success" : "error"}
                      sx={{
                        textTransform: "uppercase",
                        fontWeight: 600,
                        py: 1,
                        px: 2,
                      }}
                    />
                  )}
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => setDlg({ open: false, row: null })}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    color: (theme) => theme.palette.text.primary,
                    borderColor: (theme) => theme.palette.divider,
                  }}
                >
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
