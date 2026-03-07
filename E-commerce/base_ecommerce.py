#%%
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

n_registros = 10000

np.random.seed(42)

data_inicio = datetime(2022, 1, 1)
datas_venda = [data_inicio + timedelta(days=i) for i in range(n_registros)] 

ids_cliente = np.random.randint(1, 1001, n_registros)

produtos = ['Laptop', 'Smartphone', 'Tablet', 'Fone de ouvido']
categorias = ['Eletrônicos', 'Eletrônicos', 'Eletrônicos', 'Acessórios']

indices_produto = np.random.randint(0, len(produtos), n_registros)
produtos_vendidos = [produtos[i] for i in indices_produto]
categorias_vendidas = [categorias[i] for i in indices_produto]

quantidades = np.random.randint(1, 6, n_registros)
valores_unitarios = np.random.uniform(50, 2000, n_registros)
valores_venda = quantidades * valores_unitarios

estados = ['CA', 'NY', 'TX', 'FL', 'IL']
estados_venda = np.random.choice(estados, n_registros)

idades_cliente = np.random.randint(18, 80, n_registros)

df = pd.DataFrame({
    'id_pedido': range(1, n_registros + 1),
    'data_venda': datas_venda,
    'ids_cliente': ids_cliente,
    'idade_cliente': idades_cliente,
    'produto': produtos_vendidos,
    'categoria': categorias_vendidas,
    'quantidade': quantidades,
    'valor_unitario': valores_unitarios,
    'valores_venda': valores_venda,
    'estado': estados_venda
})

feedbacks_positivos = [
    "Excelente produto!",
    "Entrega rápida!",
    "Muito satisfeito com a compra.",
    "Atendimento excepcional.",
    "Produto com ótimo custo-benefício."
]

feedbacks_neutros = [
    "Produto ok.",
    "Entrega dentro do prazo previsto.",
    "Sem reclamações.",
    "Produto cumpre o que promete",
    "Atendimento sem problema"
]

feedbacks_negativos = [
    "Produto com defeito",
    "Entrega atrasada",
    "Qualidade inferior ao anunciado",
    "Péssimo atendimento",
    "Arrependido da compra"
]

feedbacks = np.random.choice([0, 1, 2], n_registros, p=[0.6, 0.3, 0.1])
df['feedback'] = [
    np.random.choice(feedbacks_positivos) if f == 0 else
    np.random.choice(feedbacks_neutros) if f == 1 else
    np.random.choice(feedbacks_negativos)
    for f in feedbacks
]

df.to_csv('vendas_ecommerce.csv', index=False)
print("Arquivo 'vendas_ecommerce.csv' gerado com sucesso")
# %%
