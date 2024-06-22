# Cadern.in v2

## entidades
- arquivo: `{ path, checksum, createdAt, updatedAt }`
- part: `{ instrument, svg, pdf, midi, mp3 }`
- tag: `{ key: value }`
- song: `{ title, author, tags, sub, mscz, midi, mp3, parts }`
- musicoteca v1: estilo/música/projeto - música
- musicoteca v2: projeto/música
  + índice de processamento: `{ project: { song: { mscz, metajson }}`
  + índice de busca: `{ title, author, tags }`
- cadernhinho:
```
  {
    variant: { instrument, title, cover, pdf?, generatedAt }[],
    rows: Song || Section
  }
```


## migração: v1 -> v2
- Lê drive na musicoteca atual
- Escreve diretórios na musicoteca nova: projeto/partitura

## indexador
- Lê drive na musicoteca nova
- Executa periodicamente
- Só processa dados necessários
- Verifica atualizações com checksum
- Escreve índices e arquivo de erros

## cadern.in
- Lê musicoteca com URL
- Possibilita buscar partituras e exportar um caderninho
- Ver caderninho se houver json na musicoteca
- Coleção é a lista de partituras com metadados
- Ler coleção de zip (.mscz + .metajson) ao invés de http
- Possibilita fazer capa, escolher instrumentos e sobrescrever dados
- Exportar zip completo de projeto

## cadern.in bot
- Busca em musicoteca (mscz)
