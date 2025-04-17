from firebase_admin import credentials, initialize_app, firestore
from config import FIREBASE_CREDENTIALS_PATH

# Inicializa o Firebase
cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
initialize_app(cred)
db = firestore.client()

def setup_order_listener(callback):
    """Configura o listener para novos pedidos"""
    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            if change.type.name == 'ADDED':
                order = change.document.to_dict()
                order['id'] = change.document.id
                
                # Converte o timestamp do Firestore para datetime
                if 'createdAt' in order and hasattr(order['createdAt'], 'to_pydatetime'):
                    order['createdAt'] = order['createdAt'].to_pydatetime()
                
                callback(order)
    
    # Inicia o listener do Firestore
    col_query = db.collection('orders')
    col_query.on_snapshot(on_snapshot) 