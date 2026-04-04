---
name: pbi-add-layout
description: Adicionar um layout a um relatório do Power BI através de um arquivo JSON dentro do arquivo pbip. 
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

Define the functionality provided by this skill, including detailed instructions and examples

# Skill: pbi-add-layout

## Objetivo
1. Adicionar um layout (imagem) como recurso registrado dentro de um arquivo PBIP/PBIX exportado em estrutura de diretórios (ex.: `definition/`), atualizando os metadados do relatório para referenciar esse recurso.
	 - Detalhes:
		 - A skill deve localizar o pacote do relatório (pasta `definition`), copiar/registrar a imagem em `StaticResources/RegisteredResources` e adicionar a entrada correspondente em `report.json` sob a seção apropriada (`RegisteredResources` ou similar).
		 - Deve criar ou atualizar uma página (`pages/<PageName>/page.json`) que utilize a imagem como background, definindo propriedades essenciais como `name`, `displayName`, `width`, `height` e `objects.background` que referenciam o recurso registrado.
		 - Deve atualizar `pages/pages.json` para inserir a nova página no `pageOrder` e definir `activePageName` quando solicitado.
	 - Restrições:
		 - Não deve alterar outros objetos visuais além dos necessários para registrar a imagem e configurar o background da página.
		 - Deve preservar identidades/ids existentes de páginas e visuais que não foram explicitamente substituídos pelo usuário.
		 - A imagem de layout deve ter tamanho/ratio compatível com o `width`/`height` da página; caso contrário, aplicar uma política de dimensionamento (`Fill`, `Fit`, etc.) definida pelo usuário ou por padrão.

---

## Panorama (quando usar)
1. Inserção de um novo template visual (layout) em um relatório existente.
2. Substituição de um layout provisório por um layout final enviado pelo time de design.
3. Criação de uma página de demonstração ou tela de abertura que exige background fixo.
4. Automação de preparação de relatórios para publicação corporativa, consolidando imagens e metadados.

---

## Regras Obrigatórias
1. Validação de caminho: confirmar que a estrutura `definition/`, `definition/report.json` e `definition/pages/` existe antes de alterar.
2. Backup: gravar uma cópia de segurança de `report.json` e de qualquer `page.json` alterado (ex.: `file.ext.bak` ou commit temporário) antes de aplicar alterações.
3. Atomicidade: aplicar mudanças de forma atômica; se qualquer etapa falhar, reverter alterações parciais e reportar erro.
4. Sanitização: validar nomes de arquivos e nomes de páginas para evitar caracteres inválidos no arquivo JSON do relatório.
5. Permissões: verificar que o processo tem permissão de escrita nas pastas alvo; caso contrário, abortar com instruções claras.
6. Idempotência: aplicar a mesma operação duas vezes não deve criar entradas duplicadas (por exemplo, não duplicar `RegisteredResources` para a mesma imagem).

---

## Pontos de decisão
1. Imagem já existe nos recursos registrados:
	 - Opções: substituir (overwrite), renomear novo recurso, ou abortar. Usuário escolhe via parâmetro.
2. Página com mesmo `name` já existe:
	 - Opções: substituir a página (remover a antiga), criar nova com sufixo (`Teste-1`), renomear a página ou abortar.
3. Incompatibilidade de proporção da imagem com a página:
	 - Opções: aplicar `Fill`, `Fit`, `Center`, ou redimensionar automaticamente; padrão: `Fill`.
4. Falha de validação de JSON/estrutura:
	 - Opções: abortar e exibir erro, ou tentar correção automática mínima (por exemplo, inserir campos ausentes usando valores padrão). Preferência padrão: abortar e listar correções sugeridas.

---

## Modelo (entregáveis da skill)
1. Arquivo de recurso adicionado em `StaticResources/RegisteredResources/<image>` (novo ou substituído).
2. Entrada em `definition/report.json` na secção `RegisteredResources` apontando para a imagem.
3. Arquivo de página novo ou atualizado em `definition/pages/<PageName>/page.json` configurado para usar o recurso como background.
4. Atualização de `definition/pages/pages.json` com `pageOrder` e `activePageName` ajustados conforme necessário.
5. Relatório de execução (metadata) contendo: operações realizadas, arquivos modificados, decisões tomadas e hashes/commits se aplicável.

---

## Saída
A skill deverá retornar um objeto JSON com o resumo da operação. Exemplo de saída (formato):

### Report.json:
#### Adicionar:
Deverá ser adicionado em `report.json` na secção `RegisteredResources` um código com estrutura similar a este:
```json
    {
      "name": "RegisteredResources",
      "type": "RegisteredResources",
      "items": [
        {
          "name": "Layout02240790626614997.png",
          "path": "Layout02240790626614997.png",
          "type": "Image"
        }
      ]
    }
```

#### Antes:
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/3.1.0/schema.json",
  "themeCollection": {
    "baseTheme": {
      "name": "CY26SU02",
      "reportVersionAtImport": {
        "visual": "2.6.0",
        "report": "3.1.0",
        "page": "2.3.0"
      },
      "type": "SharedResources"
    }
  },
  "objects": {
    "section": [
      {
        "properties": {
          "verticalAlignment": {
            "expr": {
              "Literal": {
                "Value": "'Top'"
              }
            }
          }
        }
      }
    ]
  },
  "resourcePackages": [
    {
      "name": "SharedResources",
      "type": "SharedResources",
      "items": [
        {
          "name": "CY26SU02",
          "path": "BaseThemes/CY26SU02.json",
          "type": "BaseTheme"
        }
      ]
    }
  ],
  "settings": {
    "useStylableVisualContainerHeader": true,
    "exportDataMode": "AllowSummarized",
    "defaultDrillFilterOtherVisuals": true,
    "allowChangeFilterTypes": true,
    "useEnhancedTooltips": true,
    "useDefaultAggregateDisplayName": true
  }
}
```

#### Depois:
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/3.1.0/schema.json",
  "themeCollection": {
    "baseTheme": {
      "name": "CY26SU02",
      "reportVersionAtImport": {
        "visual": "2.6.0",
        "report": "3.1.0",
        "page": "2.3.0"
      },
      "type": "SharedResources"
    }
  },
  "objects": {
    "section": [
      {
        "properties": {
          "verticalAlignment": {
            "expr": {
              "Literal": {
                "Value": "'Top'"
              }
            }
          }
        }
      }
    ]
  },
  "resourcePackages": [
    {
      "name": "SharedResources",
      "type": "SharedResources",
      "items": [
        {
          "name": "CY26SU02",
          "path": "BaseThemes/CY26SU02.json",
          "type": "BaseTheme"
        }
      ]
    },
    {
      "name": "RegisteredResources",
      "type": "RegisteredResources",
      "items": [
        {
          "name": "Layout02240790626614997.png",
          "path": "Layout02240790626614997.png",
          "type": "Image"
        }
      ]
    }
  ],
  "settings": {
    "useStylableVisualContainerHeader": true,
    "exportDataMode": "AllowSummarized",
    "defaultDrillFilterOtherVisuals": true,
    "allowChangeFilterTypes": true,
    "useEnhancedTooltips": true,
    "useDefaultAggregateDisplayName": true
  }
}
```


### Page.json (dentro de `definition/pages/<PageName>/page.json`):
#### Adicionar:
```json
"objects": {
    "background": [
      {
        "properties": {
          "image": {
            "image": {
              "name": {
                "expr": {
                  "Literal": {
                    "Value": "'Layout.png'"
                  }
                }
              },
              "url": {
                "expr": {
                  "ResourcePackageItem": {
                    "PackageName": "RegisteredResources",
                    "PackageType": 1,
                    "ItemName": "Layout02240790626614997.png"
                  }
                }
              },
              "scaling": {
                "expr": {
                  "Literal": {
                    "Value": "'Fill'"
                  }
                }
              }
            }
          },
          "transparency": {
            "expr": {
              "Literal": {
                "Value": "0D"
              }
            }
          }
        }
      }
    ]
  }
  ```


#### Antes:
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json",
  "name": "<PageName>",
  "displayName": "<PageDisplayName>",
  "displayOption": "FitToPage",
  "height": 1080,
  "width": 1960
}
```

#### Depois:
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json",
  "name": "<PageName>",
  "displayName": "<PageDisplayName>",
  "displayOption": "FitToPage",
  "height": 1080,
  "width": 1960,
  "objects": {
    "background": [
      {
        "properties": {
          "image": {
            "image": {
              "name": {
                "expr": {
                  "Literal": {
                    "Value": "'Layout.png'"
                  }
                }
              },
              "url": {
                "expr": {
                  "ResourcePackageItem": {
                    "PackageName": "RegisteredResources",
                    "PackageType": 1,
                    "ItemName": "Layout02240790626614997.png"
                  }
                }
              },
              "scaling": {
                "expr": {
                  "Literal": {
                    "Value": "'Fill'"
                  }
                }
              }
            }
          },
          "transparency": {
            "expr": {
              "Literal": {
                "Value": "0D"
              }
            }
          }
        }
      }
    ]
  }
}
```

---
_Notas de implementação e melhores práticas:_
- Sempre operar em cópias/branches quando possível para permitir revisão (PR).
- Registrar logs detalhados para auditoria e reprodução de problemas.
- Permitir parâmetros configuráveis (nome da página, política de escalonamento, comportamento em conflito).
