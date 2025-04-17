import { Box, Container, Typography, Paper } from '@mui/material';

export function TermsOfUse() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Termos de Uso
        </Typography>

        <Typography paragraph sx={{ mt: 3 }}>
          Por favor, leia atentamente estes Termos de Uso antes de utilizar nossos serviços.
        </Typography>

        <Typography paragraph>
          Ao acessar e utilizar este site e nossos serviços relacionados à venda de conteúdo de Final Fantasy XIV, 
          você concorda com os seguintes termos e condições:
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Descrição dos Serviços
          </Typography>
          <Typography paragraph>
            Oferecemos a venda de conteúdo digital relacionado ao jogo Final Fantasy XIV. Isso pode incluir, 
            mas não se limita a, itens virtuais, moeda do jogo, serviços de boosting, e outros serviços 
            relacionados ao jogo.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2. Violação da Política do Final Fantasy XIV
          </Typography>
          <Typography paragraph>
            Você reconhece e concorda que os serviços oferecidos neste site podem violar os termos de serviço 
            e as políticas da Square Enix, a desenvolvedora e detentora dos direitos de Final Fantasy XIV. 
            A Square Enix pode tomar medidas contra contas que utilizem serviços de terceiros não autorizados, 
            incluindo a suspensão ou banimento permanente da conta.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3. Isenção de Responsabilidade por Banimentos
          </Typography>
          <Typography paragraph>
            Você expressamente concorda que a utilização dos nossos serviços é feita por sua própria conta e risco. 
            Não nos responsabilizamos por qualquer suspensão, banimento ou outra penalidade que sua conta de 
            Final Fantasy XIV possa sofrer como resultado da utilização dos nossos serviços. Ao utilizar nossos 
            serviços, você assume total responsabilidade por quaisquer consequências que possam ocorrer.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4. Conduta do Usuário
          </Typography>
          <Typography paragraph>
            Ao utilizar nossos serviços, você concorda em não:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Violar qualquer lei ou regulamento aplicável.</li>
            <li>Utilizar nossos serviços para atividades ilegais ou não autorizadas.</li>
            <li>Tentar obter acesso não autorizado a contas de outros usuários ou a qualquer parte do nosso site.</li>
            <li>Interferir ou interromper a operação do nosso site ou dos nossos serviços.</li>
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            5. Pagamento
          </Typography>
          <Typography paragraph>
            Os pagamentos pelos nossos serviços devem ser realizados de acordo com os métodos especificados no site. 
            Todos os preços estão sujeitos a alterações sem aviso prévio.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6. Alterações nos Termos de Uso
          </Typography>
          <Typography paragraph>
            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento, sem aviso prévio. É sua 
            responsabilidade revisar periodicamente estes termos para estar ciente de quaisquer alterações. O uso 
            continuado do nosso site e serviços após a publicação de quaisquer alterações constitui sua aceitação 
            dessas alterações.
          </Typography>

          <Typography paragraph sx={{ mt: 4 }}>
            Ao utilizar nossos serviços, você declara que leu, entendeu e concorda com todos os termos e condições 
            presentes neste Termos de Uso.
          </Typography>

          <Typography paragraph sx={{ mt: 2, fontWeight: 'bold' }}>
            Se você não concorda com algum destes termos, por favor, não utilize nossos serviços.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Última atualização: {new Date().toLocaleDateString()}
        </Typography>
      </Paper>
    </Container>
  );
} 