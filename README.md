# Planejador de Escala 5x2

Ferramenta web (um único `index.html`, sem dependências) para montar escalas 5x2 de acordo com a **EC 141/2026**, o **Decreto 13.173/2026** e a **Portaria MTE 2.041/2026**.

## O que faz

1. Você informa a atividade (comércio ou demais), o limite semanal (42h ou 40h), se há acordo/convenção coletiva, os dias em que a empresa abre e o mínimo de pessoas por dia.
2. Lança a **escala atual** de cada colaborador (horas por dia da semana, 0 = folga).
3. A ferramenta:
   - aponta o que a escala atual descumpre nas regras novas;
   - gera até 4 opções de nova escala para o mês escolhido (folga fixa com domingo, revezamento dominical, otimizada por cobertura e, com acordo, semana longa/curta);
   - mostra o calendário dia a dia, a cobertura por dia e os pontos a revisar;
   - exporta CSV (abre no Excel) e imprime.

Os dados ficam salvos só no navegador de quem usa (localStorage).

## Regras verificadas

- 2 repousos semanais de 24h; no máximo 6 dias seguidos de trabalho.
- Até 8h/dia e 42h/semana (a partir de 16/12/2026) ou 40h (a partir de 16/12/2027).
- Com acordo/convenção: folgas redistribuídas no mês (mínimo 9 em meses de 29–31 dias, 8 em fevereiro), média mensal de horas e compensação até 10h/dia.
- Domingo: 1 folga a cada 3 semanas no comércio, a cada 4 nas demais atividades; revezamento quinzenal para mulheres (art. 386 CLT).

Fora do escopo: feriados, interjornada de 11h, 12x36, turnos ininterruptos, tempo parcial e cláusulas específicas de cada convenção.

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `escala-5x2`) e envie o `index.html` e este `README.md` para a branch `main`.
2. Em **Settings → Pages**, em *Source* escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
3. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/escala-5x2/`.

Pela linha de comando:

```bash
git init && git add . && git commit -m "Planejador de escala 5x2"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/escala-5x2.git
git push -u origin main
```

> Ferramenta de apoio ao planejamento. Não substitui a leitura da Portaria 2.041/2026 nem da convenção coletiva da categoria.
