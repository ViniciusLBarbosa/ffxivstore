export function formatPrice(price) {
  // Se o preço for uma string, converte para número removendo "R$" e outros caracteres
  if (typeof price === 'string') {
    price = Number(price.replace(/[^0-9.-]+/g, ''));
  }

  // Formata o número para ter sempre 2 casas decimais e adiciona "R$"
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
} 