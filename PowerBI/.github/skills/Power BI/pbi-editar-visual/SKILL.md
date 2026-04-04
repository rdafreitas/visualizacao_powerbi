---
name: pbi-editar-visual
description: Criar/editar qualquer tipo de visual numa página de relatório Power BI (linha, coluna, barras, rosca, pizza, KPI, cartão, tabela, matriz, filtro, mapa e outros) alterando o visual.json da pasta correspondente.
---

# Skill: pbi-editar-visual

## Objetivo

1. Inserir ou atualizar um visual em `definition/pages/<PageName>/visuals/<id>/visual.json`.
   - Detalhes:
     - Definir o `visualType` correto de acordo com o tipo de visual escolhido pelo usuário (consultar tabela de tipos na seção **Pontos de decisão**).
     - Configurar posição (`x`, `y`, `z`, `tabOrder`), dimensões (`width`, `height`), campos/medidas e opções de formatação conforme o tipo de visual.
     - Definir comportamentos de interação: `drillFilterOtherVisuals`, tooltip, cross-filtering e drill quando aplicável.
   - Restrições:
     - Referenciar apenas campos e medidas existentes no modelo semântico; não criar medidas automaticamente.
     - Evitar sobrescrever visuais sem antes gerar backup do arquivo original.

## Panorama (quando usar)

1. Criar um novo visual em branco numa página existente para posterior configuração no Power BI Desktop.
2. Alterar o tipo de um visual já existente (ex.: converter barra em linha) sem recriar toda a configuração.
3. Ajustar posição e dimensões de um visual via arquivos PBIP.
4. Editar formatação de visuais existentes (bordas, sombra, fundo do card, título).

## Regras Obrigatórias

1. Criar backup do `visual.json` antes de qualquer alteração (salvar como `visual.json.bak`).
2. Validar a existência da pasta do visual (`visuals/<id>/`) antes de escrever; criar a pasta se necessário, seguindo a convenção `<tipo>_<seq>` (ex.: `linha_01`, `rosca_02`).
3. Confirmar com o usuário o `visualType` quando houver ambiguidade (ex.: "barras" pode ser `barChart` ou `clusteredBarChart`).
4. Idempotência: executar a operação múltiplas vezes não deve criar duplicatas; se o arquivo já existir, perguntar antes de sobrescrever.
5. Após gravar o arquivo, informar ao usuário: _"📁 Alteração realizada via modificação nos arquivos PBIP. Feche o arquivo aberto no Power BI Desktop (sem salvar) e abra-o novamente para visualizar as modificações."_
6. **Saídas específicas por tipo de visual**: determinadas seções de saída só são aplicáveis a tipos específicos de visual. Antes de gerar qualquer bloco da **Saída das edições específicas**, verificar se o `visualType` escolhido está na lista de tipos permitidos para aquela saída. Se não estiver, **omitir o bloco silenciosamente** (não incluir no `visual.json`). A lista de permissões por saída está definida no cabeçalho de cada subseção.

## Pontos de decisão

### 1. Modo de operação

Ao iniciar a skill, apresentar as seguintes opções via seleção no chat:

> **O que deseja fazer?**
>
> **A)** Gerar somente o visual.
> **B)** Gerar visual e editar layout.

- **Opção A — Gerar somente o visual**: coletar tipo de visual, posição, dimensões e campos/medidas. Gerar a saída básica + dados + filtros.
- **Opção B — Gerar visual e editar layout**: coletar as mesmas informações da Opção A, mais as configurações de fundo, sombra, borda e título. Gerar todas as saídas incluindo a saída de edições.

Após a escolha, solicitar ao usuário que preencha as informações via chat conforme o modo selecionado.

---

### 2. Tipo de visual

Perguntar ao usuário qual tipo de visual deseja criar ou alterar. Usar a tabela abaixo para mapear o nome amigável ao `visualType` correto:

| Nome amigável                  | `visualType`                           |
| ------------------------------ | -------------------------------------- |
| Gráfico de linha               | `lineChart`                            |
| Gráfico de área                | `areaChart`                            |
| Gráfico de coluna agrupada     | `clusteredColumnChart`                 |
| Gráfico de coluna empilhada    | `stackedColumnChart`                   |
| Gráfico de coluna 100%         | `hundredPercentStackedColumnChart`     |
| Gráfico de barras agrupadas    | `clusteredBarChart`                    |
| Gráfico de barras empilhadas   | `barChart`                             |
| Gráfico de barras 100%         | `hundredPercentStackedBarChart`        |
| Linha + Coluna (combo)         | `lineClusteredColumnComboChart`        |
| Linha + Coluna empilhada       | `lineStackedColumnComboChart`          |
| Gráfico de pizza               | `pieChart`                             |
| Gráfico de rosca               | `donutChart`                           |
| Gráfico de dispersão           | `scatterChart`                         |
| Gráfico de funil               | `funnel`                               |
| Mapa coroplético               | `filledMap`                            |
| Mapa de bolhas                 | `map`                                  |
| Treemap                        | `treemap`                              |
| Cascata (waterfall)            | `waterfallChart`                       |
| Gráfico de faixas (ribbon)     | `ribbonChart`                          |
| KPI                            | `kpi`                                  |
| Cartão (card)                  | `card`                                 |
| Cartão de múltiplas linhas     | `multiRowCard`                         |
| Tabela                         | `tableEx`                              |
| Matriz                         | `matrix`                               |
| Segmentação (filtro/slicer)    | `slicer`                               |
| Medidor (gauge)                | `gauge`                                |
| Influenciadores principais     | `keyInfluencers`                       |
| Narrativa inteligente          | `smartNarrativeVisual`                 |
| Caixa de texto                 | `textbox`                              |
| Imagem                         | `image`                                |
| Forma / retângulo              | `shape`                                |
| Botão                          | `actionButton`                         |
| Desconhecido / personalizado   | Perguntar ao usuário o valor exato     |

Se o tipo informado não estiver na tabela, perguntar ao usuário o `visualType` exato antes de prosseguir.

---

### 3. Informações de posição e dimensões (ambos os modos)

Solicitar ao usuário que informe os seguintes valores via chat:

- `x` — posição horizontal (em pixels, relativa ao container da página)
- `y` — posição vertical (em pixels, relativa ao container da página)
- `width` — largura do visual (em pixels)
- `height` — altura do visual (em pixels)

Se o usuário não souber os valores, sugerir valores padrão e confirmar antes de aplicar:

| Campo    | Valor padrão sugerido |
| -------- | --------------------- |
| `x`      | `0`                   |
| `y`      | `0`                   |
| `width`  | `400`                 |
| `height` | `280`                 |

---

### 4. Campos e medidas (ambos os modos)

Perguntar ao usuário se deseja configurar campos e medidas no visual agora ou deixar para configurar manualmente no Power BI Desktop:

> **Deseja configurar os campos/medidas agora?**
>
> **A)** Sim — informarei os campos e medidas no chat.
> **B)** Não — configurarei manualmente no Power BI Desktop depois.

Se **Opção A**: solicitar ao usuário que informe, para cada eixo/função do visual (ex.: Eixo X, Valores, Legenda, Categoria), a entidade (`Entity`) e a propriedade (`Property`) ou medida correspondente. Montar a seção `query.queryState` conforme a estrutura de saída dos dados.

---

### 5. Layout e formatação (somente Modo B)

Solicitar ao usuário que informe as configurações de layout via chat. Para cada item abaixo, o usuário pode informar os valores ou pular:

- **Fundo do card**: cor (hex) e transparência (0–100%).
- **Sombra (shadow)**: ativar/desativar; cor e intensidade quando ativo.
- **Borda**: ativar/desativar; cor (hex), espessura (px) e arredondamento (px) quando ativa.
- **Título**: texto, cor (hex), fonte, tamanho (pt) e alinhamento.

> _A estrutura JSON correspondente às edições de layout será adicionada futuramente com exemplos concretos._

---

### 6. Sobrescrever visual existente

Se já existir um `visual.json` na pasta alvo, apresentar a seguinte opção via seleção no chat:

> **Já existe um visual nesta pasta. O que deseja fazer?**
>
> **A)** Sobrescrever (o arquivo atual será salvo como `.bak`).
> **B)** Cancelar.

Somente após escolha **A** prosseguir com a geração do backup e a gravação do novo arquivo.

---

### 7. Formatação adicional

Após criar o visual, independente de ser no Modo A ou B, perguntar ao usuário se deseja configurar formatação adicional:

> **Deseja configurar alguma formatação?**
> 1. Borda do card (cor, espessura, arredondamento)
> 2. Fundo do card (cor, transparência)
> 3. Título (texto, cor, fonte, tamanho)
> 4. Rótulos de dados (cor, formato, posição)
> 5. Nenhuma

Aplicar cada item confirmado ao `visual.json` dentro da seção `"visualContainerObjects"` ou equivalente conforme o schema vigente. Repetir a pergunta até o usuário escolher a opção 5.

---

## Modelo (entregáveis)

1. `definition/pages/<PageName>/visuals/<id>/visual.json` — arquivo do visual com `visualType`, posição, dimensões, dados e (se Modo B) configurações de layout.
2. `definition/pages/<PageName>/visuals/<id>/visual.json.bak` — backup do arquivo anterior (se existia).
3. Relatório de execução com: tipo de visual criado, posição/dimensões aplicadas, campos/medidas configurados e eventuais avisos.

---

## Saída

### Saída básica do visual

Estrutura mínima gerada para o `visual.json` (compatível com o schema 2.7.0 ou 2.6.0). Presente em ambos os modos (A e B):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.6.0/schema.json",
  "name": "<id_do_visual>",
  "position": {
    "x": 0,
    "y": 0,
    "z": 0,
    "height": 280,
    "width": 400,
    "tabOrder": 0
  },
  "visual": {
    "visualType": "<visualType_escolhido>",
    "drillFilterOtherVisuals": true
  }
}
```

Substituir `<id_do_visual>` pelo nome da pasta (ex.: `coluna_01`) e `<visualType_escolhido>` pelo valor da tabela de tipos (ex.: `lineChart`, `donutChart`, `slicer`).

---

### Saída dos dados do visual

Bloco `visual` completo com a configuração de campos e medidas (`query.queryState` e `sortDefinition`). Gerado quando o usuário optou por configurar campos/medidas (Ponto de decisão 4, Opção A):

```json
"visual": {
  "visualType": "barChart",
  "query": {
    "queryState": {
      "Category": {
        "projections": [
          {
            "field": {
              "Column": {
                "Expression": {
                  "SourceRef": {
                    "Entity": "<entidade>"
                  }
                },
                "Property": "<campo_categoria>"
              }
            },
            "queryRef": "<entidade>.<campo_categoria>",
            "nativeQueryRef": "<campo_categoria>",
            "active": true
          }
        ]
      },
      "Y": {
        "projections": [
          {
            "field": {
              "Aggregation": {
                "Expression": {
                  "Column": {
                    "Expression": {
                      "SourceRef": {
                        "Entity": "<entidade>"
                      }
                    },
                    "Property": "<campo_valor>"
                  }
                },
                "Function": 0
              }
            },
            "queryRef": "Sum(<entidade>.<campo_valor>)",
            "nativeQueryRef": "Soma de <campo_valor>"
          }
        ]
      }
    },
    "sortDefinition": {
      "sort": [
        {
          "field": {
            "Aggregation": {
              "Expression": {
                "Column": {
                  "Expression": {
                    "SourceRef": {
                      "Entity": "<entidade>"
                    }
                  },
                  "Property": "<campo_valor>"
                }
              },
              "Function": 0
            }
          },
          "direction": "Descending"
        }
      ],
      "isDefaultSort": true
    }
  },
  "drillFilterOtherVisuals": true
}
```

Substituir `<entidade>`, `<campo_categoria>` e `<campo_valor>` pelos valores informados pelo usuário. O campo `"Function": 0` representa a agregação `Sum`; ajustar conforme necessário (`1` = Count, `2` = Average, etc.).

---

### Saída dos filtros presentes no visual

Bloco `filterConfig` gerado automaticamente a partir dos campos configurados na query. Gerado junto com a saída dos dados quando há campos configurados:

```json
"filterConfig": {
  "filters": [
    {
      "name": "<id_filtro_categoria>",
      "field": {
        "Column": {
          "Expression": {
            "SourceRef": {
              "Entity": "<entidade>"
            }
          },
          "Property": "<campo_categoria>"
        }
      },
      "type": "Categorical"
    },
    {
      "name": "<id_filtro_valor>",
      "field": {
        "Aggregation": {
          "Expression": {
            "Column": {
              "Expression": {
                "SourceRef": {
                  "Entity": "<entidade>"
                }
              },
              "Property": "<campo_valor>"
            }
          },
          "Function": 0
        }
      },
      "type": "Advanced"
    }
  ]
}
```

Os valores `<id_filtro_*>` são identificadores únicos gerados automaticamente (hash hexadecimal de 20 caracteres). Campos categóricos recebem `"type": "Categorical"`; campos de medida/agregação recebem `"type": "Advanced"`.

---

### Saída das edições do visual

Bloco `visualContainerObjects` com configurações de fundo, sombra e borda. Gerado somente no **Modo B** (Gerar visual e editar layout). Deve ser inserido dentro do objeto `visual`, antes de `drillFilterOtherVisuals`:

```json
"visualContainerObjects": {
  "background": [
    {
      "properties": {
        "color": {
          "solid": {
            "color": {
              "expr": {
                "ThemeDataColor": {
                  "ColorId": 2,
                  "Percent": 0.6
                }
              }
            }
          }
        },
        "transparency": {
          "expr": {
            "Literal": {
              "Value": "50D"
            }
          }
        }
      }
    }
  ],
  "border": [
    {
      "properties": {
        "show": {
          "expr": {
            "Literal": {
              "Value": "true"
            }
          }
        },
        "color": {
          "solid": {
            "color": {
              "expr": {
                "Literal": {
                  "Value": "'#a0d1ff'"
                }
              }
            }
          }
        },
        "radius": {
          "expr": {
            "Literal": {
              "Value": "10D"
            }
          }
        }
      }
    }
  ],
  "dropShadow": [
    {
      "properties": {
        "show": {
          "expr": {
            "Literal": {
              "Value": "true"
            }
          }
        },
        "color": {
          "solid": {
            "color": {
              "expr": {
                "ThemeDataColor": {
                  "ColorId": 1,
                  "Percent": 0.6
                }
              }
            }
          }
        }
      }
    }
  ],
  "title": [
    {
      "properties": {
        "fontFamily": {
          "expr": {
            "Literal": {
              "Value": "'Arial'"
            }
          }
        },
        "fontSize": {
          "expr": {
            "Literal": {
              "Value": "12D"
            }
          }
        },
        "fontColor": {
          "solid": {
            "color": {
              "expr": {
                "ThemeDataColor": {
                  "ColorId": 6,
                  "Percent": 0
                }
              }
            }
          }
        },
        "background": {
          "solid": {
            "color": {
              "expr": {
                "ThemeDataColor": {
                  "ColorId": 0,
                  "Percent": -0.3
                }
              }
            }
          }
        }
      }
    }
  ]
}
```

**Referência dos campos:**

| Propriedade                    | Descrição                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `background.color`             | Cor de fundo do card (hex ou cor do tema — ver nota abaixo).                                |
| `background.transparency`      | Transparência do fundo em `"<valor>D"` (ex.: `"50D"` = 50%). O `D` indica decimal.         |
| `border.show`                  | Exibir borda: `"true"` ou `"false"`.                                                        |
| `border.color`                 | Cor da borda (hex ou cor do tema).                                                          |
| `border.radius`                | Arredondamento dos cantos em `"<valor>D"` (ex.: `"10D"` = 10px).                           |
| `dropShadow.show`              | Exibir sombra: `"true"` ou `"false"`.                                                                              |
| `dropShadow.color`             | Cor da sombra (hex ou cor do tema).                                                                                |
| `title.fontFamily`             | Fonte do título (ex.: `"'Arial'"`). Valor entre aspas simples dentro de aspas duplas.                             |
| `title.fontSize`               | Tamanho da fonte em `"<valor>D"` (ex.: `"12D"` = 12pt).                                                           |
| `title.fontColor`              | Cor do texto do título (hex ou cor do tema).                                                                       |
| `title.background`             | Cor de fundo da área do título (hex ou cor do tema). `Percent` negativo = tom mais escuro (ex.: `-0.3` = 30% escuro). |

**Diferença entre cor hexadecimal e cor do tema (ThemeDataColor):**

No Power BI existem duas formas de definir uma cor num `visual.json`:

1. **Cor hexadecimal** — cor fixa, independente do tema aplicado ao relatório. Definida com `"Literal"` e o valor entre aspas simples dentro de aspas duplas:
   ```json
   "expr": {
     "Literal": {
       "Value": "'#a0d1ff'"
     }
   }
   ```
   Use quando quiser uma cor exata que **não mude** ao trocar o tema.

2. **Cor do tema (ThemeDataColor)** — cor vinculada à paleta do tema ativo no relatório. Definida com `"ThemeDataColor"`, `ColorId` (índice da cor na paleta, iniciando em 0) e `Percent` (variação de brilho: `0` = cor pura, valores positivos = mais claro, negativos = mais escuro):
   ```json
   "expr": {
     "ThemeDataColor": {
       "ColorId": 2,
       "Percent": 0.6
     }
   }
   ```
   Use quando quiser que a cor **acompanhe automaticamente** o tema do relatório. Ao trocar o tema, a cor se atualiza sem necessidade de editar o JSON.

---

### Saída das edições de rótulo

Bloco `objects.labels` com configurações de rótulos de dados do visual. Gerado somente no **Modo B** (Gerar visual e editar layout). Deve ser inserido dentro do objeto `visual`, antes de `visualContainerObjects`:

```json
"objects": {
  "labels": [
    {
      "properties": {
        "show": {
          "expr": {
            "Literal": {
              "Value": "true"
            }
          }
        },
        "labelPosition": {
          "expr": {
            "Literal": {
              "Value": "'InsideEnd'"
            }
          }
        },
        "color": {
          "solid": {
            "color": {
              "expr": {
                "ThemeDataColor": {
                  "ColorId": 1,
                  "Percent": 0
                }
              }
            }
          }
        },
        "fontSize": {
          "expr": {
            "Literal": {
              "Value": "8D"
            }
          }
        },
        "labelDisplayUnits": {
          "expr": {
            "Literal": {
              "Value": "1D"
            }
          }
        },
        "labelPrecision": {
          "expr": {
            "Literal": {
              "Value": "2L"
            }
          }
        }
      }
    }
  ]
}
```

**Referência dos campos:**

| Propriedade          | Descrição                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `show`               | Exibir rótulos de dados: `"true"` ou `"false"`.                                                                                                                  |
| `labelPosition`      | Posição do rótulo em relação à barra/ponto (ex.: `"'InsideEnd'"`, `"'OutsideEnd'"`, `"'InsideBase'"`, `"'InsideCenter'"`). Valor entre aspas simples.             |
| `color`              | Cor do texto do rótulo (hex ou cor do tema).                                                                                                                      |
| `fontSize`           | Tamanho da fonte em `"<valor>D"` (ex.: `"8D"` = 8pt).                                                                                                            |
| `labelDisplayUnits`  | Unidade de exibição do valor: `"1D"` = nenhuma (valor bruto), `"1000D"` = milhares (K), `"1000000D"` = milhões (M), `"1000000000D"` = bilhões (bi).              |
| `labelPrecision`     | Número de casas decimais em `"<valor>L"` (ex.: `"2L"` = 2 casas decimais). O `L` indica inteiro longo.                                                          |

---

### Saída das edições específicas

Seções de saída restritas a tipos de visual específicos. Gerar somente no **Modo B** e somente quando o `visualType` estiver na lista de permissões da subseção correspondente (conforme Regra Obrigatória 6). Inserir dentro do objeto `objects`, junto com o bloco `labels` quando ambos forem aplicáveis.

#### Ajustes de Barra

> **Tipos de visual permitidos**: `barChart`, `clusteredBarChart`, `hundredPercentStackedBarChart`  
> Para outros tipos, omitir este bloco.

Blocos `objects.dataPoint` e `objects.categoryAxis` com configurações específicas de gráficos de barra. Devem ser adicionados dentro do mesmo objeto `objects` que contém `labels`:

```json
"dataPoint": [
  {
    "properties": {
      "fill": {
        "solid": {
          "color": {
            "expr": {
              "ThemeDataColor": {
                "ColorId": 6,
                "Percent": 0
              }
            }
          }
        }
      },
      "borderShow": {
        "expr": {
          "Literal": {
            "Value": "true"
          }
        }
      },
      "borderColor": {
        "solid": {
          "color": {
            "expr": {
              "ThemeDataColor": {
                "ColorId": 1,
                "Percent": 0
              }
            }
          }
        }
      },
      "borderSize": {
        "expr": {
          "Literal": {
            "Value": "3D"
          }
        }
      },
      "borderTransparency": {
        "expr": {
          "Literal": {
            "Value": "50D"
          }
        }
      }
    }
  }
],
"categoryAxis": [
  {
    "properties": {
      "innerPadding": {
        "expr": {
          "Literal": {
            "Value": "30L"
          }
        }
      }
    }
  }
]
```

**Referência dos campos:**

| Propriedade                 | Descrição                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `dataPoint.fill`            | Cor de preenchimento das barras (hex ou cor do tema).                                                         |
| `dataPoint.borderShow`      | Exibir borda nas barras: `"true"` ou `"false"`.                                                               |
| `dataPoint.borderColor`     | Cor da borda das barras (hex ou cor do tema).                                                                 |
| `dataPoint.borderSize`      | Espessura da borda em `"<valor>D"` (ex.: `"3D"` = 3px).                                                      |
| `dataPoint.borderTransparency` | Transparência da borda em `"<valor>D"` (ex.: `"50D"` = 50%).                                             |
| `categoryAxis.innerPadding` | Espaçamento interno entre as barras em `"<valor>L"` (ex.: `"30L"` = 30%). O `L` indica inteiro longo.       |

