#%% 1. Importar Bibliotecas
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
#%% 2. Info Básica da Base
n_registros = 10000
np.random.seed(42)  # Para reprodutibilidade
ids_cliente = np.random.randint(1, 1001, n_registros) # IDs de clientes entre 1 e 1000

#%% 3. Info de Categorias
transacao = ['Laptop', 'Smartphone', 'Tablet', 'Fone de ouvido']
detalhes = ['Dell XPS 13', 'iPhone 12', 'iPad Pro', 'Sony WH-1000XM4']
categorias = ['Eletrônicos', 'Eletrônicos', 'Eletrônicos', 'Acessórios']
forma_pgto = ['Cartão de Crédito', 'Boleto', 'Pix', 'Transferência']
banco = ['Nubank','Santander','Inter','Bradesco']
tipo = ['Saída', 'Entrada']

#3.1. Conectar as informações


#%% 4. Info de Datas
data_prevista 
data_realizada
mes_referencia

#%% 5. Gerar Valores
