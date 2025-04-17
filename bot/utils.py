def format_order_message(order):
    """Formata a mensagem de notificação do pedido"""
    
    # Cabeçalho da mensagem
    message = [
        "🎮 **Novo Pedido Confirmado!**",
        f"📦 **Número do Pedido:** #{order['id'][-6:]}",
        "\n**Detalhes do Pedido:**"
    ]

    # Adiciona os itens do pedido
    for item in order['items']:
        item_details = [f"\n🎯 **{item['name']}**"]
        
        if item['category'] == 'leveling':
            item_details.extend([
                f"• Level: {item['startLevel']} → {item['endLevel']}",
                f"• Job: {item['selectedJob']}"
            ])
        elif item['category'] == 'gil':
            gil_amount = f"{item['gilAmount']:,}".replace(',', '.')
            item_details.append(f"• Quantidade: {gil_amount} milhões de Gil")
        
        item_details.append(f"• Quantidade: {item['quantity']}x")
        
        # Adiciona o preço do item
        if order['currency'] == 'USD':
            item_details.append(f"• Preço: ${item['price']:.2f}")
        else:
            item_details.append(f"• Preço: R$ {item['price']:.2f}")
        
        message.extend(item_details)

    # Adiciona o total e forma de pagamento
    message.extend([
        "\n💰 **Resumo do Pagamento:**",
        f"• Método: {get_payment_method_label(order['payment']['method'])}",
        f"• Total: {'$' if order['currency'] == 'USD' else 'R$ '}{order['total']:.2f}"
    ])

    # Adiciona as instruções
    message.extend([
        "\n📝 **Próximos Passos:**",
        "1. Em breve enviaremos as instruções de pagamento",
        "2. Após a confirmação do pagamento, iniciaremos seu pedido",
        "3. Mantenha seu Discord ativo para comunicação",
        "\n❓ **Precisa de Ajuda?**",
        "Entre em contato conosco pelo Discord se tiver alguma dúvida!"
    ])

    return "\n".join(message)

def get_payment_method_label(method):
    """Retorna o label do método de pagamento"""
    labels = {
        'pix': 'PIX',
        'credit': 'Cartão de Crédito',
        'boleto': 'Boleto Bancário'
    }
    return labels.get(method, method) 