document.addEventListener('DOMContentLoaded', function () {
  var blocks = document.querySelectorAll('code.language-mermaid');
  if (!blocks.length) return;

  blocks.forEach(function (code) {
    var pre = code.parentElement;
    var div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    pre.replaceWith(div);
  });

  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        // Base colors matching the blog theme
        primaryColor: '#322a2d',
        primaryTextColor: '#cbbec2',
        primaryBorderColor: '#f18eb0',
        lineColor: '#997582',
        secondaryColor: '#47393e',
        tertiaryColor: '#272022',
        
        // Background
        background: '#272022',
        mainBkg: '#322a2d',
        secondBkg: '#47393e',
        tertiaryBkg: '#272022',
        
        // Text colors
        textColor: '#cbbec2',
        labelTextColor: '#cbbec2',
        nodeTextColor: '#cbbec2',
        
        // Border and line styling
        nodeBorder: '#f18eb0',
        clusterBorder: '#997582',
        defaultLinkColor: '#f18eb0',
        
        // Edge label background
        edgeLabelBackground: '#322a2d',
        
        // Font
        fontFamily: '"Source Code Pro", monospace',
        fontSize: '14px'
      }
    });
    mermaid.run();
  }
});
