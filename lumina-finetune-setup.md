# Guia de Fine-Tuning do Llama para a Lúmina

## Contexto

Este guia instrui como realizar o fine-tuning real do modelo `llama3.2:3b` com os dados
reais de conversas da Scapini Transportes. O fine-tuning usa QLoRA (quantização 4-bit +
LoRA), que roda na RTX 3050 6GB com pouca memória VRAM.

O dataset é gerado pelo script `lumina-dataset-builder.js`:

```bash
npm run build-dataset
# Gera: lumina-dataset.jsonl (pares pergunta→resposta no formato Llama 3.2)
```

---

## Pré-requisitos

### Hardware
- GPU: NVIDIA RTX 3050 6GB (mínimo para Llama 3.2 3B com QLoRA 4-bit)
- RAM: 16 GB ou mais
- Espaço em disco: 20 GB livres

### Software

```bash
# 1. Python 3.11 (recomendado) ou 3.10
python --version  # deve ser 3.10 ou 3.11

# 2. CUDA Toolkit 12.1+
nvcc --version  # deve aparecer versão 12.x

# 3. Instalar dependências Python
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps "xformers<0.0.27" trl peft accelerate bitsandbytes
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

---

## Script de Fine-Tuning

Salve como `lumina_train.py` e execute com `python lumina_train.py`:

```python
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# ── Configuração do modelo base ──────────────────────────────────────────────
MODEL_NAME = "unsloth/Llama-3.2-3B-Instruct-bnb-4bit"
MAX_SEQ_LEN = 2048  # RTX 3050 6GB: não exceda 2048

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name   = MODEL_NAME,
    max_seq_length = MAX_SEQ_LEN,
    dtype        = None,   # auto-detecta (float16 na RTX 3050)
    load_in_4bit = True,   # QLoRA — obrigatório para caber na 3050
)

# ── Configuração LoRA ────────────────────────────────────────────────────────
model = FastLanguageModel.get_peft_model(
    model,
    r              = 16,         # rank da LoRA — 16 é equilíbrio qualidade/VRAM
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha     = 16,
    lora_dropout   = 0,          # sem dropout para dataset pequeno
    bias           = "none",
    use_gradient_checkpointing = "unsloth",   # economiza VRAM na 3050
    random_state   = 42,
)

# ── Dataset ──────────────────────────────────────────────────────────────────
dataset = load_dataset("json", data_files="lumina-dataset.jsonl", split="train")

# ── Treinamento ──────────────────────────────────────────────────────────────
trainer = SFTTrainer(
    model        = model,
    tokenizer    = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = MAX_SEQ_LEN,
    dataset_num_proc = 2,
    args = TrainingArguments(
        per_device_train_batch_size = 1,       # 1 para RTX 3050 6GB
        gradient_accumulation_steps = 8,       # simula batch de 8
        warmup_steps                = 5,
        max_steps                   = 60,      # ~1h na RTX 3050 com 300+ exemplos
        learning_rate               = 2e-4,
        fp16                        = True,    # RTX 3050 usa fp16
        bf16                        = False,   # bf16 só em GPUs Ampere+ com suporte nativo
        logging_steps               = 1,
        optim                       = "adamw_8bit",
        output_dir                  = "lumina-finetuned",
        save_strategy               = "no",
    ),
)

trainer.train()
print("✅ Fine-tuning concluído!")

# ── Salvar como GGUF (para importar no Ollama) ───────────────────────────────
model.save_pretrained_gguf(
    "lumina-gguf",
    tokenizer,
    quantization_method = "q4_k_m",   # Q4_K_M: bom equilíbrio qualidade/tamanho
)
print("✅ Modelo exportado para lumina-gguf/")
```

---

## Importar o modelo treinado no Ollama

Após o fine-tuning, o modelo GGUF fica em `lumina-gguf/`. Para importá-lo:

```bash
# 1. Criar um Modelfile apontando para o GGUF gerado
# (copie o conteúdo do Modelfile.lumina e ajuste a linha FROM)
cat > Modelfile.lumina.finetuned << 'EOF'
FROM ./lumina-gguf/unsloth.Q4_K_M.gguf

SYSTEM """
[cole aqui o mesmo SYSTEM do Modelfile.lumina]
"""

PARAMETER temperature 0.65
PARAMETER num_predict 600
PARAMETER num_ctx 8192
PARAMETER repeat_penalty 1.1
EOF

# 2. Criar o modelo no Ollama
ollama create lumina-finetuned -f Modelfile.lumina.finetuned

# 3. Testar o modelo treinado
ollama run lumina-finetuned "quem é o CEO da Scapini?"
```

---

## Atualizar a Lúmina para usar o modelo treinado

Após validar o modelo:

```bash
# Via API da Lúmina (server.js rodando)
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"ollamaModel": "lumina-finetuned"}'
```

Ou manualmente: abrir as Configurações da Lúmina → campo "Modelo Ollama" → digitar `lumina-finetuned`.

---

## Dicas para a RTX 3050 6GB

| Parâmetro | Valor recomendado | Motivo |
|-----------|-------------------|--------|
| `load_in_4bit` | `True` | Obrigatório — 3B 4-bit usa ~2.5 GB VRAM |
| `max_seq_length` | `2048` | Acima de 2048 dá OOM na 3050 |
| `batch_size` | `1` | Evita OOM durante o treino |
| `gradient_accumulation_steps` | `8` | Simula batch maior sem gastar VRAM |
| `max_steps` | `60–120` | 60 steps com 300 exemplos = boa cobertura sem overfitting |
| `fp16` | `True` | RTX 3050 tem suporte nativo a FP16 |

Se aparecer `CUDA out of memory`:
1. Reduza `max_seq_length` para `1024`
2. Ou reduza `gradient_accumulation_steps` para `4`
3. Feche todos os outros programas que usam GPU

---

## Quando fazer o fine-tuning?

Recomendação: quando `lumina-dataset.jsonl` tiver **500+ exemplos**. Verifique com:

```bash
npm run build-dataset
# Saída: ✅ lumina-dataset.jsonl gerado: XXX exemplos
```

Com menos de 200 exemplos o fine-tuning pode não generalizar bem. Espere acumular mais
conversas reais antes de treinar.
