import { Box, Container, Typography, Paper } from '@mui/material';

export function TermsOfUse() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Terms of Use
        </Typography>

        <Typography paragraph sx={{ mt: 3 }}>
          Please read these Terms of Use carefully before using our services.
        </Typography>

        <Typography paragraph>
          By accessing and using this site and our services related to the sale of Final Fantasy XIV content, 
          you agree to the following terms and conditions:
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Description of Services
          </Typography>
          <Typography paragraph>
            We offer the sale of digital content related to the game Final Fantasy XIV. This can include, 
            but is not limited to, virtual items, game currency, boosting services, and other services 
            related to the game.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2. Violation of Final Fantasy XIV Policy
          </Typography>
          <Typography paragraph>
            You recognize and agree that the services offered on this site may violate the terms of service 
            and policies of Square Enix, the developer and owner of Final Fantasy XIV. Square Enix may take measures against accounts that use unauthorized third-party services, 
            including suspension or permanent ban of the account.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3. Ban Disclaimer
          </Typography>
          <Typography paragraph>
            You expressly agree that the use of our services is at your own risk. 
            We are not responsible for any suspension, ban, or other penalty that your 
            Final Fantasy XIV account may suffer as a result of using our services. 
            By using our services, you assume full responsibility for any consequences that may occur.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4. User Conduct
          </Typography>
          <Typography paragraph>
            By using our services, you agree not to:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Violate any applicable law or regulation.</li>
            <li>Use our services for illegal or unauthorized activities.</li>
            <li>Attempt to gain unauthorized access to other users' accounts or any part of our website.</li>
            <li>Interfere with or disrupt the operation of our website or services.</li>
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            5. Payment
          </Typography>
          <Typography paragraph>
            Payments for our services must be made according to the methods specified on the website. 
            All prices are subject to change without prior notice.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6. Changes to Terms of Use
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these Terms of Use at any time, without prior notice. It is your 
            responsibility to periodically review these terms to be aware of any changes. Continued use of 
            our website and services after the posting of any changes constitutes your acceptance of those changes.
          </Typography>

          <Typography paragraph sx={{ mt: 4 }}>
            By using our services, you declare that you have read, understood, and agree to all the terms and conditions 
            present in these Terms of Use.
          </Typography>

          <Typography paragraph sx={{ mt: 2, fontWeight: 'bold' }}>
            If you do not agree with any of these terms, please do not use our services.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  );
} 