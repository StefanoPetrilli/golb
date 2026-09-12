document.addEventListener('DOMContentLoaded', function () {
  // ponytail: default delimiters ($$, \( \), \[ \]); no single-$ so prose with a
  // literal dollar sign is safe. Add {left:'$',right:'$'} here if inline math is needed.
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body);
  }
});
