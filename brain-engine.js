/**
 * Mega Brain Engine - Aprendizado incremental baseado nas tags e vocabulário do usuário.
 * Arquitetura plana (mesma raiz).
 */
class MegaBrainEngine {
  constructor(modelState = null) {
    this.tagWeights = modelState?.tagWeights || {}; // { tag: { token: count } }
    this.tagTotals = modelState?.tagTotals || {};   // { tag: totalNotes }
    this.coOccurrence = modelState?.coOccurrence || {}; // { tagA: { tagB: count } }
    this.stopWords = new Set([
      'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não',
      'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas',
      'ao', 'ele', 'das', 'à', 'seu', 'sua', 'ou', 'quando', 'muito', 'nos', 'já',
      'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois'
    ]);
  }

  tokenize(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.stopWords.has(w));
  }

  normalizeTag(tag) {
    return tag.trim().toLowerCase().replace(/^#+/, '');
  }

  trainFromNote(title, content, tags = []) {
    const cleanTags = [...new Set(tags.map(t => this.normalizeTag(t)).filter(Boolean))];
    if (!cleanTags.length) return;

    const tokens = this.tokenize(`${title} ${content}`);
    for (const tag of cleanTags) {
      this.tagTotals[tag] = (this.tagTotals[tag] || 0) + 1;
      if (!this.tagWeights[tag]) this.tagWeights[tag] = {};
      for (const token of tokens) {
        this.tagWeights[tag][token] = (this.tagWeights[tag][token] || 0) + 1;
      }

      if (!this.coOccurrence[tag]) this.coOccurrence[tag] = {};
      for (const other of cleanTags) {
        if (other !== tag) {
          this.coOccurrence[tag][other] = (this.coOccurrence[tag][other] || 0) + 1;
        }
      }
    }
  }

  rebuildModel(notes) {
    this.tagWeights = {};
    this.tagTotals = {};
    this.coOccurrence = {};
    for (const note of notes) {
      this.trainFromNote(note.title, note.content, note.tags || []);
    }
  }

  suggestTags(title, content, existingTags = [], limit = 5) {
    const tokens = this.tokenize(`${title} ${content}`);
    const already = new Set(existingTags.map(t => this.normalizeTag(t)));
    const scores = {};

    for (const [tag, vocab] of Object.entries(this.tagWeights)) {
      if (already.has(tag)) continue;
      let score = 0;
      const docCount = this.tagTotals[tag] || 1;
      for (const token of tokens) {
        if (vocab[token]) {
          score += (vocab[token] / docCount) * Math.log1p(vocab[token]);
        }
      }
      if (score > 0.15) {
        scores[tag] = (scores[tag] || 0) + score;
      }
    }

    // Reforço por co-ocorrência de tags já selecionadas
    for (const tag of already) {
      const related = this.coOccurrence[tag] || {};
      for (const [relTag, count] of Object.entries(related)) {
        if (!already.has(relTag)) {
          scores[relTag] = (scores[relTag] || 0) + count * 0.6;
        }
      }
    }

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, score]) => ({ tag, confidence: Math.min(99, Math.round(score * 35)) }));
  }

  getStats() {
    const totalTags = Object.keys(this.tagTotals).length;
    const totalPatterns = Object.values(this.tagWeights).reduce(
      (acc, vocab) => acc + Object.keys(vocab).length, 0
    );
    const topTags = Object.entries(this.tagTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { totalTags, totalPatterns, topTags };
  }

  exportState() {
    return {
      tagWeights: this.tagWeights,
      tagTotals: this.tagTotals,
      coOccurrence: this.coOccurrence
    };
  }
}

window.MegaBrainEngine = MegaBrainEngine;
