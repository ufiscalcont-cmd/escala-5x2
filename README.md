# Planejador de Escala 5x2

Ferramenta web (um único `index.html`, sem dependências) para montar escalas 5x2 conforme a **EC 141/2026**, o **Decreto 13.173/2026**, a **Portaria MTE 2.041/2026** e a CLT.

**Acesse:** https://ufiscalcont-cmd.github.io/escala-5x2/

## O que faz

1. **Empresa e regras:** cidade (com feriados municipais pré-preenchidos para as cidades atendidas), UF, atividade, mês, início da semana, carga semanal e acordo (40h sem acordo; 40h com acordo individual de compensação; 42h com acordo/convenção coletiva; 42h sem acordo coletivo, com a empresa assumindo o risco), redistribuição de folgas, funcionamento em feriados, dias e horário de funcionamento e mínimo de pessoas ao mesmo tempo.
2. **Escala atual:** digitada na tela ou importada da planilha [`modelo-escala-5x2.xlsx`](modelo-escala-5x2.xlsx) (botão *Importar planilha*). Na tela, informe o horário de cada dia por colaborador (ex.: `08:00-12:00 14:00-18:00`), com perfil (mulher, menor de 18, insalubre, tempo parcial) e remuneração (mensalista ou horista).
3. **Diagnóstico:** o que a escala atual descumpre nas regras novas.
4. **Opções de nova escala:** até 4 modelos, com turnos distribuídos para cobrir o horário de funcionamento (entradas e almoços escalonados), com calendário editável (toque num dia para trocar trabalho/folga e revalidar). Toque no nome do colaborador para ver, num balão, os dias em que ele pode começar as férias.
5. **Remuneração:** salário-hora com o divisor novo, hora extra e valor-hora mínimo do horista.
6. **Documentos:** escala de revezamento para afixar e termos aditivos individuais, prontos para imprimir; exportação CSV e cópia para Excel.

Os dados ficam salvos só no navegador de quem usa.

## Carga igual para todos

A nova escala distribui a carga semanal escolhida entre os dias trabalhados de cada pessoa: um dia curto (ex.: sábado até 12h) passa a diferença para os outros dias da semana, até o teto diário permitido pelo acordo. Sem acordo de compensação, nenhum dia passa de 8h — se a semana não fechar, a ferramenta avisa. Semanas com feriado têm carga menor.

## Regras verificadas

- Transição: regra anterior até 15/12/2026; 42h e 2 repousos a partir de 16/12/2026; 40h a partir de 16/12/2027.
- 2 repousos semanais de 24h + 11h de interjornada (Súmula 110 TST); feriado não conta como repouso; máximo de 6 dias seguidos (OJ 410 TST).
- Redistribuição de folgas no mês só com norma coletiva (mínimo 9 folgas em meses de 29–31 dias, 8 em fevereiro).
- Compensação: sem acordo, 8h/dia; com acordo individual escrito (art. 59, §6º) ou norma coletiva, até 10h/dia e média mensal no limite. Menor e insalubre só com norma coletiva.
- Intervalo intrajornada (art. 71), interjornada de 11h (art. 66), trabalho noturno (art. 73) e proibição para menores (arts. 404 e 405).
- Domingos: comércio 1 a cada 3 semanas; demais 1 a cada 4; mulheres revezamento quinzenal (art. 386).
- Feriados: comércio só com convenção (Lei 10.101/2000, art. 6º-A); demais, dobro ou folga compensatória (Lei 605/1949).
- Folga trabalhada sem compensação: pagamento em dobro (Súmula 146 TST).
- Férias: início vedado nos 2 dias que antecedem feriado ou repouso (art. 134, §3º).

## Fontes dos feriados municipais

- Bahia: Decreto Judiciário TJBA nº 09/2026 (Paripiranga, Canavieiras, Cícero Dantas, Jeremoabo, Ribeira do Pombal).
- Sergipe: calendários públicos — **conferir na lei municipal**.
- Adustina, Aporá e Nossa Senhora do Socorro: sem fonte oficial localizada; preencher manualmente.

Fora do escopo: 12x36, turnos ininterruptos, sobreaviso e cláusulas específicas de cada convenção.

> Ferramenta de apoio ao planejamento. Não substitui a leitura da Portaria 2.041/2026 nem da norma coletiva da categoria.

## Testes

`node testes/fuzz.js 1000` gera 1.000 cenários aleatórios (meses de 2026 a 2028, feriados, horários de funcionamento, perfis, compensação) e confere cada escala gerada com um verificador independente das regras: repousos, domingos, intervalos, interjornada, limites de jornada, férias, remuneração e importação de planilha.
