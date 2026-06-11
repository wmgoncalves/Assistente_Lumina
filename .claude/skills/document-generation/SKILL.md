---
name: document-generation
description: Geração e edição segura de documentos pdf, docx, xlsx, pptx e CSV (relatórios, propostas, planilhas, RIPD/LGPD, exportações). Use ao gerar/exportar documentos a partir de dados. Cobre bibliotecas por linguagem, sanitização, sem fórmulas/macros perigosas, sem PII desnecessária. Complementa os document-skills oficiais da Anthropic.
---

# document-generation

Gerar arquivos de escritório a partir de dados — com segurança e sem vazar PII.

## Quando usar
- Exportar relatório, proposta, recibo, contrato em PDF/DOCX.
- Gerar planilha (XLSX/CSV) de dados, RIPD, inventário LGPD.
- Montar apresentação (PPTX).

## Bibliotecas recomendadas (server-side)
- **PHP:** `mpdf`/`dompdf` (PDF), `PhpSpreadsheet` (xlsx/csv), `PHPWord` (docx).
- **Python:** `reportlab`/`weasyprint` (PDF), `openpyxl` (xlsx), `python-docx` (docx), `python-pptx`.
- **Node:** `pdfkit`/`playwright` (PDF via HTML), `exceljs` (xlsx), `docx`.
- Cada instalação passa por `/dependency-firewall`.

## Regras de segurança
- **CSV/XLSX injection:** prefixar `'` em células que comecem com `= + - @` (evita execução de fórmula no Excel/Sheets).
- **PDF a partir de HTML:** desabilitar JavaScript no motor; não renderizar HTML não confiável sem sanitizar.
- **DOCX/XLSX/PPTX são ZIP de XML:** ao **ler** documento enviado por usuário, aplicar `/xxe-and-deserialization-hardening` (XXE/zip bomb).
- **Sem macros** (`.docm`/`.xlsm`) gerados pelo sistema.
- **Minimização (LGPD):** só os campos necessários; nada de PII supérflua; aplicar `/lgpd-compliance-check`.
- Nome de arquivo sanitizado (sem path traversal); gerar em storage isolado (`/file-upload-security`).
- Metadados: limpar autor/empresa/comentários antes de entregar externamente.

## Recusas
- Embutir macro/JS executável no documento gerado.
- Injetar dados de usuário em fórmula sem escape.
- Renderizar HTML/template não confiável no motor de PDF.

## Saída
Código mínimo de geração + nota de sanitização (CSV injection, metadados) + onde o arquivo é salvo + retenção. Oficial relacionado: `document-skills@anthropic-agent-skills` (ver [[anthropic-banco-oficial]]).

---

> 🧭 [[_HOME|🏠 HOME]] · [[skills-claude-code-MOC|⚙️ Skills Claude Code]] · [[Ecossistema-Skills-Agentes|🧩 Ecossistema]] · [[INDICE|🎯 Skills 00–18]] · [[agents-claude-code-MOC|🤖 Agentes]]
