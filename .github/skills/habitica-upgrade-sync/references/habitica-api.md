# Habitica API — Referência

Base URL: `https://habitica.com/api/v3`

## Autenticação

Todas as requisições exigem os headers:

```
x-api-user: {HABITICA_USER_ID}
x-api-key:  {HABITICA_API_TOKEN}
x-client:   {app-name}
```

Obter credenciais: Habitica → Configurações do usuário → API.

## GET /user

Retorna os dados completos do usuário autenticado.

```bash
curl -s \
  -H "x-api-user: $HABITICA_USER_ID" \
  -H "x-api-key: $HABITICA_API_TOKEN" \
  -H "x-client: gsheet-rotina" \
  "https://habitica.com/api/v3/user"
```

### Campos relevantes em `data.stats`

| Campo | Tipo | Descrição |
|---|---|---|
| `lvl` | int | Nível atual do personagem |
| `exp` | float | XP acumulado no nível atual |
| `toNextLevel` | int | XP necessário para o próximo nível |
| `gp` | float | Ouro acumulado |
| `hp` | float | Pontos de vida atuais |
| `mp` | float | Pontos de mana atuais |
| `class` | string | Classe (`warrior`, `rogue`, `healer`, `wizard`) |

### Exemplo de resposta (resumido)

```json
{
  "success": true,
  "data": {
    "stats": {
      "lvl": 42,
      "exp": 830.5,
      "toNextLevel": 1050,
      "gp": 248.75,
      "hp": 47.3,
      "mp": 120.0,
      "class": "warrior"
    }
  }
}
```

## Rate Limits

- 30 requisições por minuto por usuário.
- Em caso de HTTP 429, aguardar 60 segundos antes de retentar.

## Documentação oficial

https://habitica.com/apidoc
