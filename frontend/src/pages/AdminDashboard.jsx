import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, CssBaseline, AppBar, Toolbar, IconButton, Typography,
  Drawer, Divider, ListItemButton, ListItemIcon, ListItemText,
  Tooltip, Stack
} from "@mui/material";
import MenuIcon        from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SchoolIcon      from "@mui/icons-material/School";
import RateReviewIcon  from "@mui/icons-material/RateReview";
import LogoutIcon      from "@mui/icons-material/Logout";
import Lottie          from "lottie-react";
import adminAnim       from "../assets/lottie/admin.json";

const FULL = 250;     // drawer width when open
const MINI = 72;      // drawer width when collapsed

export default function AdminDashboard() {
  const [open, setOpen] = React.useState(true);
  const nav  = useNavigate();
  const path = useLocation().pathname;

  const items = [
    { txt: "Établissements", ico: <SchoolIcon  sx={{ fontSize: 28 }} htmlColor="#0041C2" />, to: "/admin/etablissements" },
    { txt: "Avis",           ico: <RateReviewIcon sx={{ fontSize: 28 }} htmlColor="#0041C2" />, to: "/admin/reviews"       },
  ];

  const dw = open ? FULL : MINI;   // current drawer width

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* ── Top bar ────────────────────────────────────────────── */}
      <AppBar position="fixed" sx={{ bgcolor: "#002D6B", zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(!open)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Tableau d’administration
          </Typography>

          {/* logout now lives in the AppBar */}
          <Tooltip title="Déconnexion">
            <IconButton
              color="inherit"
              onClick={() => {
                localStorage.removeItem("admin_token");
                nav("/admin/login");
              }}
            >
              <LogoutIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Drawer (sidebar) ───────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            width: dw,
            overflowX: "hidden",
            transition: (t) =>
              t.transitions.create("width", { duration: t.transitions.duration.standard }),
          },
        }}
      >
        {/* drawer header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1,
          }}
        >
          {open && (
            <Typography variant="h6" sx={{ pl: 1 }}>
              Admin
            </Typography>
          )}
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        <Divider />

        {/* nav icons */}
        <Stack
          component="nav"
          spacing={1.5}
          sx={{
            alignItems: "center",
            pt: open ? 9 : 4,   // pushes them downward
            flexGrow: 0,
          }}
        >
          {items.map(({ txt, ico, to }) => (
            <Tooltip key={txt} title={open ? "" : txt} placement="right">
              <ListItemButton
                disableRipple
                selected={path.startsWith(to)}
                onClick={() => nav(to)}
                sx={{
                  width: open ? "80%" : "auto",
                  justifyContent: "center",
                  borderRadius: 2,
                  py: 1.2,
                  bgcolor: (t) =>
                    path.startsWith(to) ? t.palette.action.selected : "transparent",
                  "&:hover": { bgcolor: (t) => t.palette.action.hover },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0 }}>{ico}</ListItemIcon>
                {open && <ListItemText sx={{ ml: 2 }} primary={txt} />}
              </ListItemButton>
            </Tooltip>
          ))}
        </Stack>

        {/* Lottie mascot */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pb: 3,
          }}
        >
          <Lottie
            animationData={adminAnim}
            loop
            style={{ height: "100%", width: "100%" }}  // fills the available space
          />
        </Box>
      </Drawer>

      {/* ── Main area ──────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          ml: `${dw}px`,
          transition: (t) =>
            t.transitions.create("margin-left", { duration: t.transitions.duration.standard }),
          flexGrow: 1,
          minHeight: "100vh",
          bgcolor: "#f5f7fc",
          p: 4,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Toolbar />
        <Box sx={{ width: "100%", maxWidth: 1350 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
