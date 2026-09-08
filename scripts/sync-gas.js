const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const gasDir = path.resolve(rootDir, 'src/gas');

// 1. styles.html
const stylesCss = fs.readFileSync(path.join(rootDir, 'src/styles.css'), 'utf-8');
fs.writeFileSync(path.join(gasDir, 'styles.html'), `<style>\n${stylesCss}\n</style>`);
console.log('✓ src/gas/styles.html atualizado.');

// 2. app.html
const appJs = fs.readFileSync(path.join(rootDir, 'src/app.js'), 'utf-8');
fs.writeFileSync(path.join(gasDir, 'app.html'), `<script>\n${appJs}\n</script>`);
console.log('✓ src/gas/app.html atualizado.');

// 3. index.html
let indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
// Substituir link do styles.css por include('styles')
indexHtml = indexHtml.replace(
  /<link rel="stylesheet" href="src\/styles\.css">/,
  `<?!= include("styles"); ?>`
);

// Substituir scripts finais
const ssrSnippet = `  <?!= include("data"); ?>
  <script>
    // Injeção direta de dados do backend (Server-Side Rendering SSR)
    (function() {
      try {
        var serverData = <?!= dadosIniciais ?>;
        if (serverData && serverData.status === 'success') {
          if (Array.isArray(serverData.inventario) && serverData.inventario.length > 0) {
            window.DASH_DATA.inventario = serverData.inventario;
          }
          if (Array.isArray(serverData.ugs) && serverData.ugs.length > 0) {
            window.DASH_DATA.ugs = serverData.ugs;
          }
          if (Array.isArray(serverData.ciclos) && serverData.ciclos.length > 0) {
            window.DASH_DATA.ciclos = serverData.ciclos;
          }
          if (serverData.ciclo) {
            window.DASH_DATA.ciclo = serverData.ciclo;
          }
          if (Array.isArray(serverData.cronograma) && serverData.cronograma.length > 0) {
            window.DASH_DATA.cronograma = serverData.cronograma;
          }
          console.log('✓ [Google Sheets] Dados sincronizados diretamente do servidor no carregamento da página.');
        }
      } catch (err) {
        console.warn('Aviso: Injeção direta de dados não disponível, usando fallback local.', err);
      }
    })();
  </script>
  <?!= include("app"); ?>`;

indexHtml = indexHtml.replace(
  /<script src="src\/data\.js"><\/script>\s*<script src="src\/app\.js"><\/script>/,
  ssrSnippet
);

fs.writeFileSync(path.join(gasDir, 'index.html'), indexHtml);
console.log('✓ src/gas/index.html atualizado.');
