document.addEventListener('DOMContentLoaded', function () {
  // ponytail: $...$ and $$...$$ delimiters are enabled, so a literal dollar sign in prose must be written \$.
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ]
    });
  }
});
