// Minimal syntax highlighter for the code on this page: js, json, bash and url.
// No dependencies; it only rewrites text into <span class="tok-*"> nodes, so the text content never changes.
(function () {
  const RULES = {
    js: [
      ['com', /\/\/[^\n]*/],
      ['str', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/],
      ['kw', /\b(?:import|from|const|let|var|await|async|new|return|function|if|else|for|of|in|typeof|export|class|throw|try|catch)\b/],
      ['lit', /\b(?:true|false|null|undefined)\b/],
      ['num', /\b\d+(?:\.\d+)?\b/],
      ['fn', /\b[A-Za-z_$][\w$]*(?=\()/],
      ['punct', /=>|\.\.\./],
    ],
    json: [
      ['key', /"(?:\\.|[^"\\])*"(?=\s*:)/],
      ['str', /"(?:\\.|[^"\\])*"/],
      ['num', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
      ['lit', /\b(?:true|false|null)\b/],
      ['punct', /[{}[\],:]/],
    ],
    bash: [
      ['str', /'[^'\n]*'|"(?:\\.|[^"\\\n])*"/],
      ['com', /#[^\n]*/],
      ['url', /https?:\/\/[^\s'"]+/],
      ['fn', /\b(?:curl|jq|cat|grep|node|npm|npx|git|cp|cd)\b/],
      ['kw', /(?<=\s)-{1,2}[A-Za-z][\w-]*/],
      ['lit', /\$[\w{}]+/],
      ['punct', /[|&;]+/],
    ],
  };
  const COMPILED = {};
  for (const [lang, rules] of Object.entries(RULES)) COMPILED[lang] = { rules, re: new RegExp(rules.map(r => '(' + r[1].source + ')').join('|'), 'g') };

  const span = (cls, text) => { const s = document.createElement('span'); s.className = 'tok-' + cls; s.textContent = text; return s; };

  function tokenize(src, lang) {
    const { rules, re } = COMPILED[lang];
    const out = [];
    let last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      if (!m[0]) { re.lastIndex++; continue; }
      if (m.index > last) out.push(src.slice(last, m.index));
      out.push(span(rules[m.slice(1).findIndex(g => g !== undefined)][0], m[0]));
      last = m.index + m[0].length;
    }
    if (last < src.length) out.push(src.slice(last));
    return out;
  }

  // scheme://host/path?key=value&key=value#fragment
  function tokenizeUrl(src) {
    const m = /^([a-z][a-z0-9+.-]*:)(\/\/[^/?#]*)?([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(src);
    if (!m) return [src];
    const out = [span('kw', m[1])];
    if (m[2]) out.push(span('fn', m[2]));
    if (m[3]) out.push(span('str', m[3]));
    if (m[4]) {
      out.push(span('punct', '?'));
      m[4].slice(1).split('&').forEach((pair, i) => {
        if (i) out.push(span('punct', '&'));
        const eq = pair.indexOf('=');
        if (eq < 0) { out.push(span('key', pair)); return; }
        out.push(span('key', pair.slice(0, eq)), span('punct', '='), span('num', pair.slice(eq + 1)));
      });
    }
    if (m[5]) out.push(span('com', m[5]));
    return out;
  }

  // Highlights every <code data-lang="..."> under root that has not been done yet.
  window.webcliHighlight = function (root = document) {
    for (const code of root.querySelectorAll('code[data-lang]:not([data-hl])')) {
      const lang = code.getAttribute('data-lang');
      const src = code.textContent;
      const nodes = lang === 'url' ? tokenizeUrl(src) : COMPILED[lang] ? tokenize(src, lang) : null;
      if (!nodes) continue;
      code.replaceChildren(...nodes);
      code.setAttribute('data-hl', lang);
    }
  };
})();
