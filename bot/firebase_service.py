import os
import asyncio
import threading
from datetime import datetime, timezone
from google.cloud import firestore
from config import FIREBASE_CREDENTIALS_PATH

# Configuração do cliente Firestore
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(FIREBASE_CREDENTIALS_PATH)
db = firestore.Client()

# Event loop principal para callbacks
main_loop = None

def convert_timestamp(timestamp):
    """Converte um timestamp do Firestore para datetime com timezone"""
    if timestamp:
        dt = timestamp.astimezone(timezone.utc)
        return dt
    return None

def setup_order_listener(callback, loop):
    """Configura um listener para novos pedidos
    
    Args:
        callback: Função de callback assíncrona para processar novos pedidos
        loop: Event loop principal do Discord
    """
    global main_loop
    main_loop = loop
    
    def on_snapshot(doc_snapshots, changes, read_time):
        """Callback do Firestore para mudanças nos documentos"""
        for change in changes:
            if change.type.name == 'ADDED':
                order_data = change.document.to_dict()
                order_data['id'] = change.document.id
                
                # Converte timestamps para datetime com timezone
                if 'createdAt' in order_data:
                    order_data['createdAt'] = convert_timestamp(order_data['createdAt'])
                if 'updatedAt' in order_data:
                    order_data['updatedAt'] = convert_timestamp(order_data['updatedAt'])
                
                # Agenda o callback no event loop principal do Discord
                if main_loop and not main_loop.is_closed():
                    future = asyncio.run_coroutine_threadsafe(
                        callback(order_data),
                        main_loop
                    )
                    # Opcional: handle future.result() para erros
                    future.add_done_callback(lambda f: handle_callback_result(f, order_data['id']))
    
    # Inicia o listener
    orders_ref = db.collection('orders')
    return orders_ref.on_snapshot(on_snapshot)

def handle_callback_result(future, order_id):
    """Trata o resultado do callback assíncrono"""
    try:
        future.result()  # Isso levantará qualquer exceção que ocorreu
    except Exception as e:
        print(f"Erro ao processar pedido {order_id}: {e}")

async def get_pending_orders():
    """Retorna todos os pedidos pendentes"""
    try:
        orders_ref = db.collection('orders')
        query = orders_ref.where('status', '==', 'pending')
        docs = query.stream()
        
        pending_orders = []
        for doc in docs:
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            
            # Converte timestamps para datetime com timezone
            if 'createdAt' in order_data:
                order_data['createdAt'] = convert_timestamp(order_data['createdAt'])
            if 'updatedAt' in order_data:
                order_data['updatedAt'] = convert_timestamp(order_data['updatedAt'])
            
            pending_orders.append(order_data)
        
        return pending_orders
    except Exception as e:
        print(f"Erro ao buscar pedidos pendentes: {e}")
        return []

async def update_order_status(order_id, new_status):
    """Atualiza o status de um pedido"""
    try:
        order_ref = db.collection('orders').document(order_id)
        order_ref.update({
            'status': new_status,
            'updatedAt': datetime.now(timezone.utc)
        })
        return True
    except Exception as e:
        print(f"Erro ao atualizar status do pedido: {e}")
        return False

async def get_order(order_id):
    """Busca um pedido específico"""
    try:
        doc = db.collection('orders').document(order_id).get()
        if doc.exists:
            order = doc.to_dict()
            order['id'] = doc.id
            
            # Converte timestamps para datetime com timezone
            if 'createdAt' in order:
                order['createdAt'] = convert_timestamp(order['createdAt'])
            if 'updatedAt' in order:
                order['updatedAt'] = convert_timestamp(order['updatedAt'])
            
            return order
        return None
    except Exception as e:
        print(f"Erro ao buscar pedido {order_id}: {e}")
        return None 