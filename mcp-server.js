'use strict';
// Lúmina MCP Server — expõe ferramentas da Lúmina para Claude Code via stdio JSON-RPC
const http = require('http');

const LUMINA_PORT = process.env.LUMINA_PORT || 8080;

const luminaFetch = (path, body) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const req  = http.request({
    hostname: 'localhost', port: LUMINA_PORT, path, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  }, res => {
    let buf = '';
    res.on('data', c => buf += c);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
      catch { resolve({ status: res.statusCode, body: { raw: buf } }); }
    });
  });
  req.on('error', reject);
  req.write(data);
  req.end();
});

const luminaGet = (path) => new Promise((resolve, reject) => {
  http.get({ hostname: 'localhost', port: LUMINA_PORT, path }, res => {
    let buf = '';
    res.on('data', c => buf += c);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
      catch { resolve({ status: res.statusCode, body: { raw: buf } }); }
    });
  }).on('error', reject);
});

// ── Tool definitions ───────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'lumina_readFile',
    description: 'Lê o conteúdo de um arquivo do computador do usuário. Suporta paginação via offset/limit.',
    inputSchema: {
      type: 'object',
      properties: {
        path:   { type: 'string', description: 'Caminho absoluto do arquivo' },
        offset: { type: 'number', description: 'Linha inicial (padrão: 0)' },
        limit:  { type: 'number', description: 'Quantas linhas ler (padrão: 300)' }
      },
      required: ['path']
    }
  },
  {
    name: 'lumina_editFile',
    description: 'Edita um arquivo com find & replace exato. old_string deve ser único no arquivo.',
    inputSchema: {
      type: 'object',
      properties: {
        path:       { type: 'string', description: 'Caminho absoluto do arquivo' },
        old_string: { type: 'string', description: 'Trecho EXATO a substituir' },
        new_string: { type: 'string', description: 'Novo texto' }
      },
      required: ['path', 'old_string', 'new_string']
    }
  },
  {
    name: 'lumina_writeFile',
    description: 'Cria ou sobrescreve um arquivo com conteúdo completo.',
    inputSchema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'Caminho absoluto do arquivo' },
        content: { type: 'string', description: 'Conteúdo completo' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'lumina_runCommand',
    description: 'Executa um comando PowerShell no computador do usuário e retorna o output.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Comando a executar' },
        cwd:     { type: 'string', description: 'Diretório de trabalho (caminho absoluto)' }
      },
      required: ['command']
    }
  },
  {
    name: 'lumina_listDir',
    description: 'Lista arquivos e pastas de um diretório.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Caminho do diretório' }
      },
      required: ['path']
    }
  },
  {
    name: 'lumina_searchCode',
    description: 'Busca padrão de texto em todos os arquivos de um diretório (como grep/ripgrep).',
    inputSchema: {
      type: 'object',
      properties: {
        pattern:       { type: 'string', description: 'Texto ou regex a buscar' },
        dir:           { type: 'string', description: 'Diretório onde buscar' },
        glob:          { type: 'string', description: 'Filtro de arquivo (ex: "*.js")' },
        caseSensitive: { type: 'boolean', description: 'Diferenciar maiúsculas/minúsculas' }
      },
      required: ['pattern', 'dir']
    }
  },
  {
    name: 'lumina_getMemory',
    description: 'Retorna a memória persistente da Lúmina: nome do usuário e fatos aprendidos sobre ele.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'lumina_queryDB',
    description: 'Consulta o banco de dados SQLite da Lúmina. Tabelas: leads, cotacoes, contatos, lembretes, historico.',
    inputSchema: {
      type: 'object',
      properties: {
        tabela: { type: 'string', enum: ['leads','cotacoes','contatos','lembretes','historico'], description: 'Tabela a consultar' },
        filtro: { type: 'string', description: 'Texto para filtrar resultados' },
        limit:  { type: 'number', description: 'Máximo de registros (padrão: 20)' }
      },
      required: ['tabela']
    }
  }
];

// ── Tool execution ─────────────────────────────────────────────────────────────
const callTool = async (name, args) => {
  switch (name) {
    case 'lumina_readFile': {
      const r = await luminaFetch('/api/dev/read', args);
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      return `📄 ${args.path} (linhas ${r.body.offset+1}–${r.body.offset+r.body.returned} de ${r.body.totalLines}):\n\`\`\`\n${r.body.content}\n\`\`\``;
    }
    case 'lumina_editFile': {
      const r = await luminaFetch('/api/dev/edit', args);
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      return `✅ ${args.path} editado.`;
    }
    case 'lumina_writeFile': {
      const r = await luminaFetch('/api/dev/write', args);
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      return `✅ ${args.path} salvo (${r.body.bytes} bytes).`;
    }
    case 'lumina_runCommand': {
      const r = await luminaFetch('/api/dev/exec', args);
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      const icon = r.body.exitCode === 0 ? '✅' : '⚠️';
      return `${icon} \`${args.command}\`\n\`\`\`\n${r.body.output || '(sem output)'}\n\`\`\``;
    }
    case 'lumina_listDir': {
      const r = await luminaFetch('/api/dev/ls', args);
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      const dirs  = r.body.items.filter(i => i.type === 'dir').map(i => `📁 ${i.name}`);
      const files = r.body.items.filter(i => i.type === 'file').map(i => `📄 ${i.name}`);
      return `**${args.path}**\n${[...dirs, ...files].join('\n')}`;
    }
    case 'lumina_searchCode': {
      const r = await luminaFetch('/api/dev/grep', args);
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      if (!r.body.count) return `Nenhum resultado para \`${args.pattern}\` em ${args.dir}`;
      return `🔍 ${r.body.count} resultado(s) para \`${args.pattern}\`:\n\`\`\`\n${r.body.matches.join('\n')}\n\`\`\``;
    }
    case 'lumina_getMemory': {
      const r = await luminaGet('/api/memory');
      if (r.status !== 200) return `Erro ao ler memória`;
      const m = r.body;
      const fatos = (m.facts || []).map(f => `• ${typeof f === 'string' ? f : f.text}`).join('\n');
      return `**Usuário:** ${m.userName || '(não identificado)'}\n**Fatos conhecidos:**\n${fatos || '(nenhum ainda)'}`;
    }
    case 'lumina_queryDB': {
      const r = await luminaFetch('/api/db/query', { tabela: args.tabela, filtro: args.filtro, limit: args.limit || 20 });
      if (r.status !== 200) return `Erro: ${r.body.error}`;
      if (!r.body.rows?.length) return `Nenhum registro em ${args.tabela}`;
      return `**${args.tabela}** (${r.body.rows.length} registros):\n\`\`\`json\n${JSON.stringify(r.body.rows, null, 2)}\n\`\`\``;
    }
    default:
      return `Ferramenta desconhecida: ${name}`;
  }
};

// ── MCP stdio JSON-RPC ─────────────────────────────────────────────────────────
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  const parts = buf.split('\n');
  buf = parts.pop();
  for (const line of parts) {
    if (!line.trim()) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    handleMessage(msg);
  }
});

const send = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

const handleMessage = async (msg) => {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return send({ jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'Lúmina-mcp', version: '1.0.0' }
    }});
  }

  if (method === 'notifications/initialized') return;

  if (method === 'tools/list') {
    return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      const result = await callTool(name, args || {});
      return send({ jsonrpc: '2.0', id, result: {
        content: [{ type: 'text', text: result }]
      }});
    } catch (e) {
      return send({ jsonrpc: '2.0', id, result: {
        content: [{ type: 'text', text: `Erro: ${e.message}` }],
        isError: true
      }});
    }
  }

  if (id != null) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
};

process.stderr.write('[Lúmina MCP] Servidor iniciado. Aguardando conexão do Claude Code...\n');
