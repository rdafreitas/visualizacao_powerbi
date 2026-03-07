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

# round the monetary values to 2 decimal places for better compression/performance
valores_unitarios = np.round(valores_unitarios, 2)
valores_venda = np.round(valores_venda, 2)

estados = ['CA', 'NY', 'TX', 'FL', 'IL']
estados_venda = np.random.choice(estados, n_registros)

idades_cliente = np.random.randint(18, 80, n_registros)

# build dataframe with explicit types where possible
# convert string columns to category to shrink memory and signal low cardinality
productos_ser = pd.Categorical(produtos_vendidos)
categorias_ser = pd.Categorical(categorias_vendidas)
estados_ser = pd.Categorical(estados_venda)

df = pd.DataFrame({
    'id_pedido': pd.Series(range(1, n_registros + 1), dtype='int32'),
    'data_venda': pd.Series(datas_venda, dtype='datetime64[ns]'),
    'ids_cliente': pd.Series(ids_cliente, dtype='int32'),
    'idade_cliente': pd.Series(idades_cliente, dtype='int16'),
    'produto': productos_ser,
    'categoria': categorias_ser,
    'quantidade': pd.Series(quantidades, dtype='int8'),
    'valor_unitario': pd.Series(valores_unitarios, dtype='float32'),
    'valores_venda': pd.Series(valores_venda, dtype='float32'),
    'estado': estados_ser
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
