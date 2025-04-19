import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function TermsDialog({ open, onClose }) {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleAccept = () => {
    if (!accepted) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onClose(true);
    navigate('/checkout');
  };

  const handleCancel = () => {
    setAccepted(false);
    setShowError(false);
    onClose(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          Terms of Service
      </DialogTitle>
      <DialogContent>
        <Typography paragraph sx={{ mt: 2 }}>
          Please read these Terms of Use carefully before using our services.
        </Typography>

        <Typography paragraph>
        By accessing and using this website and our services related to the sale of Final Fantasy XIV content, you agree to the following terms and conditions:
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
          1. Description of Services
          </Typography>
          <Typography paragraph>
          We offer the sale of digital content related to the game Final Fantasy XIV. This may include, but is not limited to, virtual items, in-game currency, boosting services, and other game-related services.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          2. Violation of Final Fantasy XIV Policy

          </Typography>
          <Typography paragraph>
          You acknowledge and agree that the services offered on this website may violate the terms of service and policies of Square Enix, the developer and rights holder of Final Fantasy XIV. Square Enix may take action against accounts that use unauthorized third-party services, including the suspension or permanent banning of the account.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          3. Disclaimer of Liability for Bans
          </Typography>
          <Typography paragraph>
          You expressly agree that the use of our services is at your own risk. We are not responsible for any suspension, ban, or other penalty that your Final Fantasy XIV account may incur as a result of using our services. By using our services, you assume full responsibility for any consequences that may occur.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          4. User Conduct
          </Typography>
          <Typography paragraph>
          When using our services, you agree not to:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Violate any applicable law or regulation.</li>
            <li>Use our services for illegal or unauthorized activities.</li>
            <li>Attempt to gain unauthorized access to other users' accounts or any part of our website.</li>
            <li>Interfere with or disrupt the operation of our website or our services.</li>
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          5. Payment
          </Typography>
          <Typography paragraph>
          Payments for our services must be made in accordance with the methods specified on the website. All prices are subject to change without prior notice.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          6. Changes to the Terms of Use
          </Typography>
          <Typography paragraph>
          We reserve the right to modify these Terms of Use at any time without prior notice. It is your responsibility to periodically review these terms to be aware of any changes. Your continued use of our website and services after the posting of any changes constitutes your acceptance of those changes.
          </Typography>
        </Box>

        {showError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            You need to accept the terms of use to continue.
          </Alert>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
          }
          label="I have read and accept the terms of use."
          sx={{ mt: 3 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAccept}>
          Accept and Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
} 