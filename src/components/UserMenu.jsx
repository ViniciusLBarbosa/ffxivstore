import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export function UserMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      handleClose();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Se não houver usuário logado, não renderiza nada
  if (!user) return null;



  return (
    <>
      <Tooltip title="Menu do usuário">
        <IconButton onClick={handleClick} sx={{ p: 0 }}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName || user.email}
            sx={{ width: 32, height: 32 }}
          >
            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuClick('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>
        {user.isAdmin && (
          <MenuItem onClick={() => handleMenuClick('/admin')}>
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Painel Admin</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuClick('/orders')}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Histórico de Compras</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Configurações</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
} 