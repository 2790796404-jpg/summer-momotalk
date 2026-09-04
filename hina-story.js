(() => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  const boot = setInterval(() => {
    const chat = document.querySelector('#hina-preview .hina-chat');
    if (!chat || !window.__hinaProvidedTurns) return;
    clearInterval(boot);
    const log = chat.querySelector('.hina-log');
    const oldChoices = chat.querySelector('.hina-choices');
    const choices = oldChoices.cloneNode(false);
    oldChoices.replaceWith(choices);
    const thinking = chat.querySelector('.hina-thinking');
    const header = chat.querySelector('.hina-head > div');
    const status = document.createElement('small');
    status.className = 'hina-story-status';
    header.appendChild(status);
    let index = 1, started = false, locked = false;

    const showRecent = () => {
      const bubbles = [...log.querySelectorAll('.hina-bubble')];
      bubbles.forEach((bubble, i) => bubble.classList.toggle('shown', i >= bubbles.length - 3));
    };
    const showThinking = async () => { thinking.classList.add('show'); await wait(1250); thinking.classList.remove('show'); };
    const type = async (text, kind = 'hina') => {
      if (!text) return;
      const bubble = document.createElement('div');
      bubble.className = `hina-bubble ${kind}`;
      log.appendChild(bubble); showRecent();
      if (kind === 'teacher' || kind === 'narration') { bubble.textContent = text; log.scrollTop = log.scrollHeight; return; }
      for (const char of text) { bubble.textContent += char; log.scrollTop = log.scrollHeight; await wait(char === '\n' ? 250 : /[。！？…]/.test(char) ? 125 : 42); }
    };
    const finish = () => { status.textContent = 'SUMMER INTERLUDE · TRUE END'; choices.innerHTML = '<p class="hina-ending">—— END · 《夏日休止符》</p>'; };
    const offer = turn => { choices.innerHTML = turn.o.map((label, i) => `<button type="button" data-choice="${i}">${escapeHTML(label)}</button>`).join(''); };
    const beginButton = () => {
      status.textContent = 'SUMMER INTERLUDE · 001 / 260';
      choices.innerHTML = '<button class="hina-start" type="button">开始对话 <span>▶</span></button>';
      choices.querySelector('button').addEventListener('click', async () => { started = true; choices.innerHTML = ''; await present(); }, { once: true });
    };
    const present = async () => {
      if (!started) return beginButton();
      const turn = window.__hinaProvidedTurns[index];
      if (!turn) return finish();
      status.textContent = `SUMMER INTERLUDE · ${String(index).padStart(3, '0')} / 260`;
      choices.innerHTML = '';
      if (turn.prompt) { if (turn.kind === 'hina') await showThinking(); await type(turn.prompt, turn.kind || 'hina'); }
      if (!turn.o.length) { index += 1; await wait(950); return present(); }
      offer(turn);
    };
    choices.addEventListener('click', async event => {
      const button = event.target.closest('button[data-choice]');
      if (!button || locked) return;
      const turn = window.__hinaProvidedTurns[index];
      const choice = Number(button.dataset.choice);
      if (!turn || !Number.isInteger(choice) || !turn.o[choice]) return;
      locked = true; choices.innerHTML = '';
      await type(turn.o[choice], 'teacher');
      const replyKind = turn.aKind?.[choice] || 'hina';
      if (replyKind === 'hina') await showThinking();
      await type(turn.a[choice], replyKind);
      index += 1; await wait(700); locked = false; present();
    });
    log.innerHTML = '';
    beginButton();
  }, 80);
})();
