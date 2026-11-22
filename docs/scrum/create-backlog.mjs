#!/usr/bin/env node
/**
 * Crea (o actualiza) el backlog de ParkOne en GitHub a partir de backlog-data.mjs:
 *   - etiquetas, un issue por ítem y el tablero "ParkOne · Backlog" en GitHub Projects
 *   - campos del tablero: Sprint, Prioridad, Estimación, Inicio, Fin y Rama
 *   - los ítems ya terminados quedan cerrados y en estado Done
 *
 * Se puede ejecutar varias veces: reconoce los issues que ya existen por su ID.
 *
 * Uso (desde la raíz del repositorio):
 *   node docs/scrum/create-backlog.mjs              crea o actualiza todo en GitHub
 *   node docs/scrum/create-backlog.mjs --markdown   solo regenera docs/scrum/backlog.md
 *
 * Requiere GitHub CLI con sesión iniciada y el permiso "project"
 * (gh auth login  y  gh auth refresh -s project).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BACKLOG, OWNER, PEOPLE, PROJECT_TITLE, REPO, SPRINTS } from './backlog-data.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const LABELS = {
  story: { name: 'historia', color: '1F883D', description: 'Historia de usuario' },
  task: { name: 'tarea', color: '8250DF', description: 'Tarea técnica o de documentación' },
  backend: { name: 'backend', color: '0969DA', description: 'API, base de datos y reglas de negocio' },
  frontend: { name: 'frontend', color: 'BF3989', description: 'Aplicación Angular' },
  docs: { name: 'docs', color: '9A6700', description: 'Documentos, manuales y Scrum' },
  devops: { name: 'devops', color: '57606A', description: 'Repositorio, Docker y entrega' },
};

// ─── Contenido de cada issue (también se usa para backlog.md) ───

function issueTitle(item) {
  return `${item.id} · ${item.title}`;
}

function prLinks(item) {
  return item.done ? item.done.prs.map((n) => `#${n}`).join(', ') : '';
}

function issueBody(item) {
  const owner = PEOPLE[item.owner];
  const lines = [
    `> ${item.statement}`,
    '',
    '## Ficha',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    `| Tipo | ${item.kind === 'story' ? 'Historia de usuario' : 'Tarea'} |`,
    `| Sprint | ${item.sprint} |`,
    `| Fecha de inicio | ${item.start} |`,
    `| Fecha de fin | ${item.end} |`,
    `| Responsable | ${owner.name} (@${owner.login}) |`,
    `| Estimación | ${item.points} puntos (Fibonacci) |`,
    `| Prioridad | ${item.priority} |`,
    `| Rama | \`${item.branch}\` |`,
    '',
    '## Criterios de aceptación',
    '',
    ...item.criteria.map((criterion) => `- [${item.done ? 'x' : ' '}] ${criterion}`),
    '',
    '## Pruebas de éxito',
    '',
    ...item.success.map((test, index) => `${index + 1}. ${test}`),
    '',
    '## Pruebas de error',
    '',
    ...item.errors.map((test, index) => `${index + 1}. ${test}`),
    '',
    '## Evidencia',
    '',
    item.done
      ? `Pull request: ${prLinks(item)}.`
      : 'Al cerrar: enlace del pull request y capturas de las pruebas (Swagger o pantalla).',
  ];
  return lines.join('\n');
}

function labelsFor(item) {
  return [LABELS[item.kind].name, LABELS[item.area].name];
}

// ─── Documento backlog.md ───

function writeMarkdown() {
  const out = ['# Product backlog de ParkOne', ''];
  out.push('Generado desde `backlog-data.mjs`. Estimación en puntos de historia (escala Fibonacci).', '');
  out.push('## Sprints', '', '| Sprint | Fechas | Objetivo | Puntos |', '| --- | --- | --- | --- |');
  for (const [name, sprint] of Object.entries(SPRINTS)) {
    const points = BACKLOG.filter((item) => item.sprint === name).reduce((sum, item) => sum + item.points, 0);
    out.push(`| ${name} | ${sprint.start} a ${sprint.end} | ${sprint.goal} | ${points} |`);
  }
  out.push('', '## Resumen', '', '| ID | Ítem | Sprint | Responsable | Puntos | Prioridad | Rama |', '| --- | --- | --- | --- | --- | --- | --- |');
  for (const item of BACKLOG) {
    out.push(`| ${item.id} | ${item.title} | ${item.sprint} | ${PEOPLE[item.owner].name} | ${item.points} | ${item.priority} | \`${item.branch}\` |`);
  }
  for (const item of BACKLOG) {
    out.push('', `## ${issueTitle(item)}`, '', issueBody(item).replace(/^## /gm, '### '));
  }
  const file = join(HERE, 'backlog.md');
  writeFileSync(file, `${out.join('\n')}\n`, 'utf-8');
  console.log(`Escrito ${file}`);
}

// ─── GitHub ───

// Si la terminal se abrió antes de instalar GitHub CLI, 'gh' no está en su PATH;
// en ese caso se usa la ruta donde lo instala winget en Windows.
const GH_CANDIDATES = ['gh', 'C:\\Program Files\\GitHub CLI\\gh.exe'];
let ghCommand = null;

function resolveGh() {
  for (const candidate of GH_CANDIDATES) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // probar el siguiente
    }
  }
  console.error('No se encontró GitHub CLI. Cierra y abre la terminal, o reinstálalo con: winget install --id GitHub.cli -e');
  process.exit(1);
}

function gh(args, { json = false, allowFailure = false } = {}) {
  ghCommand ??= resolveGh();
  try {
    const output = execFileSync(ghCommand, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return json ? JSON.parse(output) : output.trim();
  } catch (error) {
    if (allowFailure) return null;
    console.error(`\nFalló: gh ${args.slice(0, 4).join(' ')} ...`);
    console.error(String(error.stderr || error.message).trim());
    process.exit(1);
  }
}

function findOrCreateProject() {
  const listing = gh(['project', 'list', '--owner', OWNER, '--format', 'json', '--limit', '50'], { json: true });
  const existing = (listing.projects ?? []).find((project) => project.title === PROJECT_TITLE);
  if (existing) {
    console.log(`Tablero existente: ${PROJECT_TITLE} (#${existing.number})`);
    return existing;
  }
  const created = gh(['project', 'create', '--owner', OWNER, '--title', PROJECT_TITLE, '--format', 'json'], { json: true });
  console.log(`Tablero creado: ${PROJECT_TITLE} (#${created.number})`);
  return created;
}

function ensureFields(projectNumber) {
  const wanted = [
    { name: 'Sprint', type: 'SINGLE_SELECT', options: Object.keys(SPRINTS) },
    { name: 'Prioridad', type: 'SINGLE_SELECT', options: ['Alta', 'Media', 'Baja'] },
    { name: 'Estimación', type: 'NUMBER' },
    { name: 'Inicio', type: 'DATE' },
    { name: 'Fin', type: 'DATE' },
    { name: 'Rama', type: 'TEXT' },
  ];
  const listFields = () =>
    gh(['project', 'field-list', String(projectNumber), '--owner', OWNER, '--format', 'json', '--limit', '50'], { json: true }).fields;

  const current = listFields();
  for (const field of wanted) {
    if (current.some((existing) => existing.name === field.name)) continue;
    const args = ['project', 'field-create', String(projectNumber), '--owner', OWNER, '--name', field.name, '--data-type', field.type];
    if (field.options) args.push('--single-select-options', field.options.join(','));
    gh(args);
    console.log(`Campo creado: ${field.name}`);
  }

  const byName = Object.fromEntries(listFields().map((field) => [field.name, field]));
  if (!byName.Status) {
    console.error('El tablero no tiene el campo Status. Créalo en GitHub y vuelve a ejecutar.');
    process.exit(1);
  }
  return byName;
}

function optionId(field, optionName) {
  const option = (field.options ?? []).find((candidate) => candidate.name === optionName);
  if (!option) {
    console.error(`El campo "${field.name}" no tiene la opción "${optionName}".`);
    process.exit(1);
  }
  return option.id;
}

function syncIssue(item, existingIssues) {
  const title = issueTitle(item);
  const found = existingIssues.find((issue) => issue.title.startsWith(`${item.id} ·`));
  const labelArgs = labelsFor(item).flatMap((label) => ['--label', label]);

  if (found) {
    gh(['issue', 'edit', String(found.number), '--repo', REPO, '--title', title, '--body', issueBody(item), ...labelArgs]);
    console.log(`Actualizado #${found.number} ${title}`);
    return found;
  }

  const url = gh([
    'issue', 'create', '--repo', REPO, '--title', title, '--body', issueBody(item),
    ...labelArgs, '--assignee', PEOPLE[item.owner].login,
  ]);
  console.log(`Creado ${url.split('/').pop().padStart(3)} ${title}`);
  return { url, number: Number(url.split('/').pop()), state: 'OPEN' };
}

function main() {
  if (process.argv.includes('--markdown')) {
    writeMarkdown();
    return;
  }

  gh(['auth', 'status']);

  for (const label of Object.values(LABELS)) {
    gh(['label', 'create', label.name, '--repo', REPO, '--color', label.color, '--description', label.description, '--force']);
  }
  console.log('Etiquetas listas.');

  const project = findOrCreateProject();
  const projectNumber = String(project.number);
  const projectId = project.id;
  gh(['project', 'link', projectNumber, '--owner', OWNER, '--repo', REPO], { allowFailure: true });
  // Público para que la docente pueda verlo sin invitación.
  gh(['project', 'edit', projectNumber, '--owner', OWNER, '--visibility', 'PUBLIC'], { allowFailure: true });

  const fields = ensureFields(projectNumber);
  const existingIssues = gh(
    ['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '300', '--json', 'number,title,url,state'],
    { json: true },
  );

  for (const item of BACKLOG) {
    const issue = syncIssue(item, existingIssues);
    const url = issue.url ?? `https://github.com/${REPO}/issues/${issue.number}`;
    const projectItem = gh(['project', 'item-add', projectNumber, '--owner', OWNER, '--url', url, '--format', 'json'], { json: true });

    const edit = (fieldName, valueArgs) =>
      gh(['project', 'item-edit', '--id', projectItem.id, '--project-id', projectId, '--field-id', fields[fieldName].id, ...valueArgs]);

    edit('Sprint', ['--single-select-option-id', optionId(fields.Sprint, item.sprint)]);
    edit('Prioridad', ['--single-select-option-id', optionId(fields.Prioridad, item.priority)]);
    edit('Estimación', ['--number', String(item.points)]);
    edit('Inicio', ['--date', item.start]);
    edit('Fin', ['--date', item.end]);
    edit('Rama', ['--text', item.branch]);
    edit('Status', ['--single-select-option-id', optionId(fields.Status, item.done ? 'Done' : 'Todo')]);

    if (item.done && issue.state === 'OPEN') {
      gh(['issue', 'close', String(issue.number), '--repo', REPO, '--comment', `Completado en ${prLinks(item)}.`]);
      console.log(`   cerrado (completado en ${prLinks(item)})`);
    }
  }

  writeMarkdown();
  console.log(`\nListo: ${BACKLOG.length} ítems en el tablero "${PROJECT_TITLE}".`);
  console.log(`Tablero: https://github.com/users/${OWNER}/projects/${projectNumber}`);
}

main();
