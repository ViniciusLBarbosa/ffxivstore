import React, { useState } from 'react';
import { Card, CardContent, Grid, Typography, Box, IconButton, Chip, Menu, MenuItem, Collapse } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown, MoreVert } from '@mui/icons-material';
import { formatPrice } from '../utils/format';

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    awaiting_payment: 'Waiting Payment',
    payment_confirmed: 'Payment Confirmed',
    processing: 'Processing...',
    completed: 'Done',
    cancelled: 'Cancelled'
  };
  return labels[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    awaiting_payment: 'info',
    payment_confirmed: 'info',
    processing: 'primary',
    completed: 'success',
    cancelled: 'error'
  };
  return colors[status] || 'default';
};

const getPaymentMethodLabel = (method) => {
  const labels = {
    pix: 'PIX',
    credit_card: 'Credit Card',
    boleto: 'Boleto'
  };
  return labels[method] || method;
};

export function OrderCard({ order, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(order.id, newStatus);
    handleClose();
  };

  return (
    <Card 
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderColor: 'primary.main',
        }
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" color="primary.main" gutterBottom>
              Pedido #{order.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(order.createdAt?.toDate()).toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <Chip
                label={getStatusLabel(order.status)}
                color={getStatusColor(order.status)}
                size="small"
                sx={{ borderRadius: 1 }}
              />
            </Grid>
            <Grid item>
              <Chip
                label={`${formatPrice(order.total, order.currency)}`}
                color="primary"
                size="small"
                sx={{ borderRadius: 1 }}
              />
            </Grid>
            <Grid item>
              <IconButton
                size="small"
                onClick={handleClick}
                sx={{ color: 'text.secondary' }}
              >
                <MoreVert />
              </IconButton>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
              onClick={() => setExpanded(!expanded)}
            >
              <Typography variant="body2">
                {expanded ? 'Hide details' : 'Show details'}
              </Typography>
              {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </Box>
          </Grid>
        </Grid>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom>
              Order Items:
            </Typography>
            {order.items?.map((item, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {item.quantity}x {item.name} - {formatPrice(item.price * item.quantity, order.currency)}
                </Typography>
              </Box>
            ))}

            <Typography variant="subtitle2" color="text.primary" sx={{ mt: 2 }} gutterBottom>
              Customer Information:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discord: {order.discordId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment Method: {getPaymentMethodLabel(order.paymentMethod)}
            </Typography>
          </Box>
        </Collapse>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }
          }}
        >
          <MenuItem 
            onClick={() => handleStatusChange('pending')}
            sx={{ color: 'warning.main' }}
          >
            Pending
          </MenuItem>
          <MenuItem 
            onClick={() => handleStatusChange('processing')}
            sx={{ color: 'info.main' }}
          >
            Processing...
          </MenuItem>
          <MenuItem 
            onClick={() => handleStatusChange('completed')}
            sx={{ color: 'success.main' }}
          >
            Done
          </MenuItem>
          <MenuItem 
            onClick={() => handleStatusChange('cancelled')}
            sx={{ color: 'error.main' }}
          >
            Cancelled
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
} 