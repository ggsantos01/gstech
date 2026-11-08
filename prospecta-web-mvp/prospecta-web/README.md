# GSTech — Prospecção Web 1.2

Painel local gratuito para pesquisar estabelecimentos, organizar potenciais clientes e preparar briefings de sites.

## O que funciona nesta versão
- Pesquisa por cidade/região e segmento usando OpenStreetMap (Nominatim + Overpass).
- Busca de estética ajustada para priorizar tags de beleza e evitar UBS, hospitais e clínicas médicas genéricas; a qualidade ainda depende da classificação feita no OpenStreetMap.
- Exibe nome, endereço, telefone e site quando esses dados estão cadastrados no OpenStreetMap.
- Botão para abrir WhatsApp quando há telefone disponível.
- Botão para visualizar a localização no Google Maps.
- Salvar/remover empresas no navegador (localStorage).
- CRM básico: acompanhar cada empresa salva por etapa (Novo, Analisado, Contatado, Respondeu, Interessado ou Cliente).
- Exportação CSV inclui a etapa atual da prospecção.
- Filtros, detalhes e exportação CSV.
- Geração de briefing para copiar no ChatGPT ou Claude e criar uma demonstração de site.

## Limitações importantes
- Não é uma integração oficial com Google Maps e não extrai dados do Google Maps.
- A cobertura do OpenStreetMap varia por região; telefones e sites podem estar ausentes ou desatualizados.
- Ter um telefone cadastrado não confirma que ele seja WhatsApp. Confirme antes de abordar.
- A busca depende de serviços públicos de terceiros e de seus limites de uso. Não faça consultas repetitivas em massa.
- A análise de oportunidade é inicial: "sem site cadastrado" significa apenas que o campo não consta na fonte consultada, não prova que a empresa não tenha site.
- A primeira versão não envia mensagens nem usa IA via API. Ela gera um briefing que você pode revisar e enviar ao ChatGPT/Claude.

## Como executar
1. Extraia o ZIP.
2. Abra a pasta `prospecta-web` no VS Code.
3. Instale a extensão **Live Server** (Ritwick Dey) ou use outro servidor estático local.
4. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.
5. Pesquise uma cidade e um segmento.

Também é possível servir a pasta com Python:
```bash
python -m http.server 8000
```
Depois abra `http://localhost:8000`.

## Privacidade e uso responsável
Os dados salvos ficam no armazenamento local do navegador deste dispositivo. Não insira dados pessoais desnecessários. Use apenas contatos comerciais públicos, respeite pedidos para não receber novas mensagens e confira a legislação e os termos das fontes consultadas.

## Fontes
- OpenStreetMap: https://www.openstreetmap.org/copyright
- Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
