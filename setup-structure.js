const fs = require('fs');
const path = require('path');

const moves = [
  ['globals.css', 'app/globals.css'],
  ['layout.tsx', 'app/layout.tsx'],
  ['page.tsx', 'app/page.tsx'],
  ['route.ts', 'app/api/analyze/route.ts'],
  ['types.ts', 'lib/types.ts'],
  ['supabaseClient.ts', 'lib/supabaseClient.ts'],
  ['storageEngine.ts', 'lib/storageEngine.ts'],
  ['tneClassifier.ts', 'lib/tneClassifier.ts'],
  ['webauthnHelper.ts', 'lib/webauthnHelper.ts'],
  ['LinkModal.tsx', 'components/LinkModal.tsx'],
  ['FolderTree.tsx', 'components/FolderTree.tsx'],
  ['LinksMediaView.tsx', 'components/LinksMediaView.tsx'],
  ['TasksView.tsx', 'components/TasksView.tsx'],
  ['ReportsView.tsx', 'components/ReportsView.tsx'],
  ['PrivateSpaceGate.tsx', 'components/PrivateSpaceGate.tsx'],
  ['SeenConfirmModal.tsx', 'components/SeenConfirmModal.tsx']
];

let movedCount = 0;
for (const [src, dest] of moves) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Movido: ${src} -> ${dest}`);
    movedCount++;
  }
}

console.log(`\nConcluído! ${movedCount} arquivos organizados na estrutura Next.js.`);
