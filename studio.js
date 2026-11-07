const AREAS = {
  visuais: "Artes visuais",
  musica: "Música",
  danca: "Dança",
  teatro: "Teatro",
  integradas: "Artes integradas"
};

const text = (value, limit = 2000) => typeof value === "string" ? value.slice(0, limit) : "";
const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
const make = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
};
const button = (label, handler, className = "button secondary") => {
  const node = make("button", className, label);
  node.type = "button";
  node.addEventListener("click", handler);
  return node;
};

/**
 * Browser-only workshops: original exercises, no recording or remote service.
 * saved: plain state from a previous onSave call (or null).
 * Returns a cleanup function that cancels any sound and pending timers.
 */
export function mountStudio(host, area, saved, onSave) {
  if (!(host instanceof Element)) throw new TypeError("O ateliê precisa de um elemento de destino.");
  if (!Object.hasOwn(AREAS, area)) throw new TypeError("Linguagem de ateliê desconhecida.");
  const initial = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  let disposed = false;
  let saving = false;
  const cleanups = [];
  host.replaceChildren();
  const workshop = make("section", "workshop");
  workshop.setAttribute("aria-label", "Ateliê de " + AREAS[area]);
  const heading = make("h3", "", "Experimente no ateliê");
  const intro = make("p", "small");
  const controls = make("div", "studio-controls");
  const status = make("p", "studio-status", "Seu estudo só é salvo quando você escolhe salvar.");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const actions = make("div", "tool-row");
  workshop.append(heading, intro, controls, actions, status);
  host.append(workshop);
  const say = message => { if (!disposed) status.textContent = message; };
  const changed = () => say("Estudo alterado. Escolha salvar para guardar esta versão.");
  const save = async (state, validation = "") => {
    if (disposed || saving) return;
    if (validation) { say(validation); return; }
    saving = true;
    saveButton.disabled = true;
    try {
      await onSave({ version: 1, area, ...state });
      say("Estudo salvo. Você pode continuar experimentando e salvar uma nova versão.");
    } catch {
      say("Não foi possível salvar agora. Seu estudo continua aqui; tente novamente antes de sair.");
    } finally {
      saving = false;
      if (!disposed) saveButton.disabled = false;
    }
  };
  let serialize = () => ({});
  let validate = () => "";
  const saveButton = button("Salvar estudo", () => save(serialize(), validate()), "button");
  actions.append(saveButton);

  if (area === "visuais") {
    intro.textContent = "Escolha uma forma e uma cor, depois componha nos 16 espaços. Teste repetição, contraste e equilíbrio. Sua composição é uma criação original.";
    const palette = [
      { id: "violeta", value: "#6537a8", name: "Violeta" },
      { id: "coral", value: "#c44932", name: "Coral" },
      { id: "verde", value: "#25684c", name: "Verde" },
      { id: "azul", value: "#245d96", name: "Azul" },
      { id: "amarelo", value: "#edbd28", name: "Amarelo" }
    ];
    const shapes = [
      { id: "circulo", glyph: "●", name: "Círculo" },
      { id: "triangulo", glyph: "▲", name: "Triângulo" },
      { id: "quadrado", glyph: "■", name: "Quadrado" },
      { id: "linha", glyph: "━", name: "Linha" },
      { id: "vazio", glyph: "", name: "Apagar" }
    ];
    const validColors = new Set(palette.map(item => item.id));
    const validShapes = new Set(shapes.map(item => item.id));
    let color = validColors.has(initial.color) ? initial.color : "violeta";
    let shape = validShapes.has(initial.shape) ? initial.shape : "circulo";
    const cells = Array.from({ length: 16 }, (_, index) => {
      const item = Array.isArray(initial.cells) ? initial.cells[index] : null;
      return item && validShapes.has(item.shape) && item.shape !== "vazio" && validColors.has(item.color)
        ? { shape: item.shape, color: item.color } : null;
    });
    const colorLabel = make("p", "small", "1. Escolha uma cor");
    const colorRow = make("div", "tool-row");
    colorRow.setAttribute("role", "group");
    colorRow.setAttribute("aria-label", "Cores da composição");
    const colorButtons = palette.map(item => {
      const node = button(item.name, () => {
        color = item.id;
        colorButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(palette[i].id === color)));
        changed();
      });
      node.style.borderBottom = "5px solid " + item.value;
      node.setAttribute("aria-pressed", String(item.id === color));
      colorRow.append(node);
      return node;
    });
    const shapeLabel = make("p", "small", "2. Escolha uma forma");
    const shapeRow = make("div", "tool-row");
    shapeRow.setAttribute("role", "group");
    shapeRow.setAttribute("aria-label", "Formas da composição");
    const shapeButtons = shapes.map(item => {
      const node = button(item.glyph + " " + item.name, () => {
        shape = item.id;
        shapeButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(shapes[i].id === shape)));
        changed();
      });
      node.setAttribute("aria-pressed", String(item.id === shape));
      shapeRow.append(node);
      return node;
    });
    const gridLabel = make("p", "small", "3. Aplique nos espaços. Use Tab ou as setas para navegar; Enter ou Espaço aplica a escolha.");
    const grid = make("div", "composition");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Composição de quatro linhas e quatro colunas");
    const tiles = [];
    const renderTile = index => {
      const node = tiles[index];
      const item = cells[index];
      const row = Math.floor(index / 4) + 1;
      const column = index % 4 + 1;
      const s = item ? shapes.find(entry => entry.id === item.shape) : null;
      const c = item ? palette.find(entry => entry.id === item.color) : null;
      node.textContent = s ? s.glyph : "+";
      node.style.color = c ? c.value : "";
      node.setAttribute("aria-label", "Linha " + row + ", coluna " + column + ": " + (item ? s.name + " " + c.name.toLowerCase() : "espaço vazio") + ". Aplicar forma e cor escolhidas.");
      node.setAttribute("aria-pressed", String(Boolean(item)));
    };
    for (let index = 0; index < 16; index += 1) {
      const node = button("", () => {
        cells[index] = shape === "vazio" ? null : { shape, color };
        renderTile(index);
        changed();
      }, "tile");
      // Use real glyphs (with text alternatives), not the stylesheet's default decorative tile.
      node.dataset.empty = "true";
      node.style.fontSize = "clamp(1.4rem, 7vw, 3.5rem)";
      node.style.lineHeight = "1";
      node.addEventListener("keydown", event => {
        const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
        if (!Object.hasOwn(moves, event.key)) return;
        event.preventDefault();
        const next = (index + moves[event.key] + 16) % 16;
        tiles[next].focus();
      });
      tiles.push(node);
      grid.append(node);
      renderTile(index);
    }
    controls.append(colorLabel, colorRow, shapeLabel, shapeRow, gridLabel, grid);
    const prompt = make("p", "small", "Repare: onde seu olhar começa? Troque uma única forma e compare. As cores não são as únicas pistas: cada peça também tem um nome e uma forma.");
    controls.append(prompt);
    const clear = button("Limpar composição", () => {
      cells.fill(null);
      cells.forEach((_, index) => renderTile(index));
      changed();
    });
    actions.prepend(clear);
    serialize = () => ({ color, shape, cells: cells.map(item => item ? { ...item } : null) });
    validate = () => cells.some(Boolean) ? "" : "Aplique ao menos uma forma antes de salvar seu estudo.";
  }

  if (area === "musica") {
    intro.textContent = "Componha um ciclo de oito tempos com três sons sintetizados originais. Ative posições, deixe pausas e compare. Nenhum som é gravação de uma obra histórica.";
    const voices = [
      { label: "Grave", frequency: 150, waveform: "sine" },
      { label: "Médio", frequency: 330, waveform: "triangle" },
      { label: "Agudo", frequency: 660, waveform: "sine" }
    ];
    const matrix = voices.map((_, row) => Array.from({ length: 8 }, (_, column) => Boolean(Array.isArray(initial.matrix?.[row]) && initial.matrix[row][column] === true)));
    let tempo = Math.round(clamp(initial.tempo, 60, 160, 96));
    let context = null;
    let timer = null;
    let active = false;
    let generation = 0;
    const nodes = new Set();
    const cells = [];
    const tempoLabel = make("label", "", "Andamento: " + tempo + " pulsações por minuto");
    const tempoInput = make("input", "project-input");
    tempoInput.type = "range";
    tempoInput.min = "60";
    tempoInput.max = "160";
    tempoInput.step = "1";
    tempoInput.value = String(tempo);
    tempoInput.setAttribute("aria-label", "Andamento, em pulsações por minuto");
    tempoInput.setAttribute("aria-valuetext", tempo + " pulsações por minuto");
    tempoInput.addEventListener("input", () => {
      tempo = Number(tempoInput.value);
      tempoLabel.textContent = "Andamento: " + tempo + " pulsações por minuto";
      tempoInput.setAttribute("aria-valuetext", tempo + " pulsações por minuto");
      if (active) stop("Reprodução interrompida para alterar o andamento. Toque de novo para comparar.");
      else changed();
    });
    tempoLabel.append(tempoInput);
    const grid = make("div", "beat-grid");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Sequenciador com três sons e oito tempos");
    grid.append(make("span", "small", "Som"));
    for (let column = 0; column < 8; column += 1) grid.append(make("span", "small", column + 1));
    voices.forEach((voice, row) => {
      grid.append(make("span", "small", voice.label));
      cells[row] = [];
      for (let column = 0; column < 8; column += 1) {
        const node = button(String(column + 1), () => {
          matrix[row][column] = !matrix[row][column];
          node.setAttribute("aria-pressed", String(matrix[row][column]));
          changed();
        }, "beat");
        node.setAttribute("aria-label", voice.label + ", tempo " + (column + 1));
        node.setAttribute("aria-pressed", String(matrix[row][column]));
        cells[row].push(node);
        grid.append(node);
      }
    });
    const clearPlaying = () => cells.flat().forEach(node => node.classList.remove("playing"));
    const stop = message => {
      generation += 1;
      active = false;
      if (timer !== null) { clearTimeout(timer); timer = null; }
      for (const entry of nodes) {
        try { entry.oscillator.stop(); } catch { /* already stopped */ }
        entry.oscillator.disconnect();
        entry.gain.disconnect();
      }
      nodes.clear();
      clearPlaying();
      play.disabled = false;
      stopButton.disabled = true;
      if (message) say(message);
    };
    const play = button("Tocar um ciclo", async () => {
      if (active || disposed) return;
      if (!matrix.some(row => row.some(Boolean))) { say("Ative ao menos um tempo. Os espaços desligados serão pausas."); return; }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { say("Este navegador não oferece áudio sintetizado. Você ainda pode compor, ler os tempos e salvar sua sequência."); return; }
      active = true;
      const run = ++generation;
      play.disabled = true;
      stopButton.disabled = false;
      try {
        context = context && context.state !== "closed" ? context : new Audio();
        await context.resume();
        if (disposed || !active || generation !== run) return;
        say("Reproduzindo um ciclo de oito tempos, em volume suave. Escolha Parar a qualquer momento.");
        let column = 0;
        const tick = () => {
          if (disposed || !active || generation !== run) return;
          clearPlaying();
          if (column >= 8) { stop("Ciclo concluído. Que efeito uma nova pausa produziria?"); return; }
          voices.forEach((voice, row) => {
            cells[row][column].classList.add("playing");
            if (!matrix[row][column]) return;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = voice.waveform;
            oscillator.frequency.value = voice.frequency;
            const now = context.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.055, now + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            oscillator.connect(gain);
            gain.connect(context.destination);
            const entry = { oscillator, gain };
            nodes.add(entry);
            oscillator.addEventListener("ended", () => {
              oscillator.disconnect();
              gain.disconnect();
              nodes.delete(entry);
            }, { once: true });
            oscillator.start(now);
            oscillator.stop(now + 0.2);
          });
          column += 1;
          timer = setTimeout(tick, 60000 / tempo);
        };
        tick();
      } catch {
        stop("Não foi possível iniciar o som. Seu padrão continua disponível para leitura e salvamento.");
      }
    });
    const stopButton = button("Parar", () => stop("Reprodução interrompida."));
    stopButton.disabled = true;
    const playback = make("div", "tool-row");
    playback.append(play, stopButton);
    controls.append(tempoLabel, grid, playback, make("p", "small", "Desafio: repita um padrão nos quatro primeiros tempos e transforme apenas uma posição nos quatro últimos. Sem áudio, leia os números e acompanhe as pausas visualmente."));
    actions.prepend(button("Limpar sequência", () => {
      stop();
      matrix.forEach((row, rowIndex) => row.forEach((_, column) => {
        matrix[rowIndex][column] = false;
        cells[rowIndex][column].setAttribute("aria-pressed", "false");
      }));
      changed();
    }));
    serialize = () => ({ tempo, matrix: matrix.map(row => [...row]) });
    validate = () => matrix.some(row => row.some(Boolean)) ? "" : "Ative pelo menos um tempo para salvar.";
    cleanups.push(() => {
      stop();
      if (context && context.state !== "closed") void context.close().catch(() => {});
    });
  }

  if (area === "danca") {
    intro.textContent = "Componha uma partitura de até oito gestos, ações ou pausas. Faça apenas movimentos confortáveis, inclusive sentado. Você pode imaginar ou descrever a sequência inteira.";
    const gestures = [
      { id: "maos", label: "Abrir as mãos", detail: "Se for confortável, abra as mãos ou imagine o gesto." },
      { id: "olhar", label: "Mudar o olhar", detail: "Escolha uma direção acessível; pode apenas indicá-la." },
      { id: "dedo", label: "Desenhar com um dedo", detail: "Desenhe uma linha pequena ou descreva seu caminho." },
      { id: "ombros", label: "Pequeno gesto de ombros", detail: "Use uma amplitude confortável ou substitua por um gesto possível." },
      { id: "objeto", label: "Conduzir um objeto", detail: "Mova um objeto leve sobre a mesa ou indique seu percurso." },
      { id: "pausa", label: "Pausa", detail: "Um instante de pausa faz parte da composição." }
    ];
    const valid = new Set(gestures.map(item => item.id));
    const sequence = Array.isArray(initial.sequence) ? initial.sequence.filter(item => valid.has(item)).slice(0, 8) : [];
    const gestureRow = make("div", "tool-row");
    gestureRow.setAttribute("role", "group");
    gestureRow.setAttribute("aria-label", "Gestos para acrescentar à composição");
    const count = make("p", "small");
    const list = make("ol", "sequence");
    list.setAttribute("aria-label", "Sua sequência de gestos");
    const empty = make("p", "small", "Escolha o primeiro gesto. Uma pausa também pode começar a dança.");
    const render = () => {
      list.replaceChildren();
      sequence.forEach((id, index) => {
        const item = gestures.find(entry => entry.id === id);
        const li = make("li", "", (index + 1) + ". " + item.label);
        li.title = item.detail;
        list.append(li);
      });
      count.textContent = sequence.length + " de 8 posições";
      empty.hidden = sequence.length > 0;
      addButtons.forEach(node => { node.disabled = sequence.length >= 8; });
      undo.disabled = sequence.length === 0;
    };
    const addButtons = gestures.map(item => {
      const node = button("+ " + item.label, () => {
        if (sequence.length >= 8) { say("Sua sequência já tem oito posições. Retire a última para revisar."); return; }
        sequence.push(item.id);
        render();
        changed();
      });
      node.title = item.detail;
      gestureRow.append(node);
      return node;
    });
    const undo = button("Retirar último gesto", () => {
      sequence.pop();
      render();
      changed();
    });
    const intentionLabel = make("label", "", "O que muda entre o começo e o final?");
    const intention = make("textarea", "project-input");
    intention.rows = 3;
    intention.maxLength = 2000;
    intention.value = text(initial.intention);
    intention.placeholder = "Ex.: o gesto pequeno se repete e termina em uma pausa.";
    intention.addEventListener("input", changed);
    intentionLabel.append(intention);
    controls.append(gestureRow, count, list, empty, intentionLabel, make("p", "small", "Revisão: encontre uma repetição e uma mudança. Se houver desconforto, pare e escolha outra forma de participação. Não é necessário filmar."));
    actions.prepend(undo);
    render();
    serialize = () => ({ sequence: [...sequence], intention: intention.value.trim() });
    validate = () => sequence.length ? "" : "Escolha ao menos um gesto ou pausa antes de salvar.";
  }

  if (area === "teatro") {
    intro.textContent = "Construa uma cena de teatro de objetos. Um personagem quer algo e encontra uma dificuldade. A sinopse organiza suas escolhas; você decide como a história continua.";
    const fields = [
      { key: "character", title: "Quem é o personagem?", placeholder: "Ex.: uma pequena viajante", max: 300 },
      { key: "object", title: "Que objeto pode representá-lo?", placeholder: "Ex.: uma folha dobrada", max: 300 },
      { key: "goal", title: "O que o personagem deseja?", placeholder: "Ex.: encontrar um lugar para descansar", max: 500 },
      { key: "conflict", title: "Que dificuldade transforma a situação?", placeholder: "Ex.: os caminhos mudam quando ela se aproxima", max: 500 }
    ];
    const inputs = {};
    const synopsis = make("div", "small");
    synopsis.setAttribute("aria-live", "polite");
    const synopsisHeading = make("h4", "", "Sua sinopse");
    const synopsisText = make("p", "", "Preencha as quatro escolhas e leia uma possibilidade de organização.");
    synopsis.append(synopsisHeading, synopsisText);
    fields.forEach(field => {
      const label = make("label", "", field.title);
      const input = make("textarea", "project-input");
      input.rows = 2;
      input.maxLength = field.max;
      input.value = text(initial[field.key], field.max);
      input.placeholder = field.placeholder;
      input.addEventListener("input", changed);
      inputs[field.key] = input;
      label.append(input);
      controls.append(label);
    });
    validate = () => fields.every(field => inputs[field.key].value.trim()) ? "" : "Complete personagem, objeto, desejo e dificuldade para organizar e salvar a cena.";
    controls.append(button("Ler minha sinopse", () => {
      const error = validate();
      if (error) { say(error); return; }
      const values = Object.fromEntries(fields.map(field => [field.key, inputs[field.key].value.trim()]));
      synopsisText.textContent = "Personagem: " + values.character + ". Em cena, pode ser representado por " + values.object + ". Seu desejo: " + values.goal + ". A situação muda com esta dificuldade: " + values.conflict + ". Que escolha fará agora?";
      say("Sinopse organizada a partir das suas palavras. Experimente mostrar uma ação sem fala.");
    }), synopsis, make("p", "small", "Desafio: invente dois finais e compare as escolhas do personagem. A cena pode existir em texto, desenho ou objetos, sem atuação pública e sem câmera."));
    serialize = () => Object.fromEntries(fields.map(field => [field.key, inputs[field.key].value.trim()]));
  }

  if (area === "integradas") {
    intro.textContent = "Planeje um pequeno projeto com pelo menos duas linguagens. Diga como elas colaboram para uma intenção, em vez de apenas aparecerem lado a lado.";
    const options = ["visuais", "musica", "danca", "teatro"];
    const selected = new Set(Array.isArray(initial.languages) ? initial.languages.filter(id => options.includes(id)) : []);
    const fieldset = make("fieldset");
    const legend = make("legend", "small", "Quais linguagens você quer aproximar? Escolha ao menos duas.");
    fieldset.append(legend);
    const labels = make("div", "tool-row");
    options.forEach(id => {
      const label = make("label");
      const input = make("input");
      input.type = "checkbox";
      input.checked = selected.has(id);
      input.value = id;
      input.addEventListener("change", () => {
        if (input.checked) selected.add(id);
        else selected.delete(id);
        changed();
      });
      label.append(input, document.createTextNode(" " + AREAS[id]));
      labels.append(label);
    });
    fieldset.append(labels);
    const fields = [
      { key: "intention", title: "Que ideia ou pergunta seu projeto explora?", placeholder: "Ex.: como um caminho pode mudar nossa atenção?" },
      { key: "collaboration", title: "Qual é a função de cada linguagem?", placeholder: "Ex.: o desenho organiza o caminho; as pausas sonoras marcam as mudanças." },
      { key: "access", title: "Como alguém poderá acompanhar de outra maneira?", placeholder: "Ex.: uma descrição do desenho e uma sequência visual dos sons." }
    ];
    const inputs = {};
    controls.append(fieldset);
    fields.forEach(field => {
      const label = make("label", "", field.title);
      const input = make("textarea", "project-input");
      input.rows = 3;
      input.maxLength = 2000;
      input.value = text(initial[field.key]);
      input.placeholder = field.placeholder;
      input.addEventListener("input", changed);
      inputs[field.key] = input;
      label.append(input);
      controls.append(label);
    });
    controls.append(make("p", "small", "Comece com um protótipo que caiba em uma folha ou sobre uma mesa. Use materiais disponíveis, identifique referências e escolha o que deseja manter privado."));
    serialize = () => ({
      languages: options.filter(id => selected.has(id)),
      ...Object.fromEntries(fields.map(field => [field.key, inputs[field.key].value.trim()]))
    });
    validate = () => selected.size < 2 ? "Escolha pelo menos duas linguagens para o projeto integrado."
      : fields.some(field => !inputs[field.key].value.trim()) ? "Registre sua intenção, a colaboração das linguagens e uma alternativa de acesso antes de salvar." : "";
  }

  return () => {
    if (disposed) return;
    disposed = true;
    cleanups.forEach(cleanup => cleanup());
  };
}

