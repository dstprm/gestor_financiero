/**
 * Test script: generates a sample org chart PPTX → /tmp/test-org.pptx
 * Run: node scripts/test-pptx.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const PptxGenJSModule = require(path.join(__dirname, '../node_modules/pptxgenjs/dist/pptxgen.cjs.js'));
const PptxGenJS = PptxGenJSModule.default ?? PptxGenJSModule;

// ────────────────────────────────────────────────────────────────
// Sample data (realistic org, 10 people, 4 levels)
// ────────────────────────────────────────────────────────────────
const employees = [
  { id: '1',  name: 'Sarah Chen',       title: 'Chief Executive Officer',   managerId: null, department: 'Executive' },
  { id: '2',  name: 'Marcus Johnson',   title: 'Chief Technology Officer',  managerId: '1',  department: 'Engineering' },
  { id: '3',  name: 'Priya Patel',      title: 'Chief People Officer',      managerId: '1',  department: 'People & HR' },
  { id: '4',  name: 'Elena Rodriguez',  title: 'VP of Engineering',         managerId: '2',  department: 'Engineering' },
  { id: '5',  name: 'David Kim',        title: 'VP of Product',             managerId: '2',  department: 'Product' },
  { id: '6',  name: 'Tom Walsh',        title: 'Director of Recruiting',    managerId: '3',  department: 'People & HR' },
  { id: '7',  name: 'Aisha Okonkwo',   title: 'Senior Software Engineer',  managerId: '4',  department: 'Engineering' },
  { id: '8',  name: 'Jake Morrison',    title: 'Software Engineer II',      managerId: '4',  department: 'Engineering' },
  { id: '9',  name: 'Nina Tanaka',      title: 'Product Manager',           managerId: '5',  department: 'Product' },
  { id: '10', name: 'Carlos Ruiz',      title: 'UX Designer',               managerId: '5',  department: 'Design' },
];

const DEPT_COLORS = {
  Engineering: '#3b82f6',
  Product: '#8b5cf6',
  Design: '#ec4899',
  'People & HR': '#10b981',
  Executive: '#f59e0b',
  Default: '#6b7280',
};

const getDeptColor = (dept) => DEPT_COLORS[dept] ?? DEPT_COLORS.Default;
const hex = (c) => c.replace('#', '');

// ────────────────────────────────────────────────────────────────
// Layout
// ────────────────────────────────────────────────────────────────
const NW = 200, NH = 90, HG = 40, VG = 60;

function buildLayout(emps) {
  const ids = new Set(emps.map(e => e.id));
  const map = new Map();
  for (const e of emps) {
    map.set(e.id, { id: e.id, x: 0, y: 0, children: [],
      parent: e.managerId && ids.has(e.managerId) ? e.managerId : null });
  }
  for (const n of map.values()) {
    if (n.parent) map.get(n.parent).children.push(n.id);
  }
  return map;
}

function layout(map, id, sx, depth) {
  const n = map.get(id);
  if (!n.children.length) { n.x = sx; n.y = depth*(NH+VG); return sx+NW+HG; }
  let c = sx;
  for (const ch of n.children) c = layout(map, ch, c, depth+1);
  n.x = (map.get(n.children[0]).x + map.get(n.children[n.children.length-1]).x) / 2;
  n.y = depth*(NH+VG);
  return c;
}

// ────────────────────────────────────────────────────────────────
// Build slide
// ────────────────────────────────────────────────────────────────
const SLIDE_W=13.33, SLIDE_H=7.5, PAD=0.4;
const MIN_FONT=8;

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
const slide = pptx.addSlide();
slide.background = { color: 'FFFFFF' }; // always white

const nodeMap = buildLayout(employees);
const ids = new Set(employees.map(e => e.id));
const roots = employees.filter(e => !e.managerId || !ids.has(e.managerId));
let cur = 0;
for (const r of roots) cur = layout(nodeMap, r.id, cur, 0);

let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
for (const n of nodeMap.values()) {
  minX=Math.min(minX,n.x); minY=Math.min(minY,n.y);
  maxX=Math.max(maxX,n.x+NW); maxY=Math.max(maxY,n.y+NH);
}

const scaleX = (SLIDE_W-2*PAD) / ((maxX-minX)/96);
const scaleY = (SLIDE_H-2*PAD) / ((maxY-minY)/96);
const scale  = Math.min(scaleX, scaleY, 1);

const toX = px => PAD + ((px-minX)/96)*scale;
const toY = py => PAD + ((py-minY)/96)*scale;
const nwIn = (NW/96)*scale;
const nhIn = (NH/96)*scale;
const nameSz   = Math.max(MIN_FONT, Math.round(10*scale));
const titleSz  = Math.max(MIN_FONT, Math.round(8*scale));
const deptSz   = Math.max(MIN_FONT, Math.round(8*scale));
const stripH   = Math.max(0.03, 0.07*scale);
const lw       = Math.max(0.5, 1.5*scale);

console.log(`scale=${scale.toFixed(3)} nodeW=${nwIn.toFixed(3)}" nodeH=${nhIn.toFixed(3)}" nameSz=${nameSz}`);

// Edges (elbow connectors — 3 line segments)
for (const emp of employees) {
  if (!emp.managerId || !ids.has(emp.managerId)) continue;
  const src = nodeMap.get(emp.managerId);
  const tgt = nodeMap.get(emp.id);
  const x1=toX(src.x+NW/2), y1=toY(src.y+NH);
  const x2=toX(tgt.x+NW/2), y2=toY(tgt.y);
  const midY=(y1+y2)/2;
  const lc='94A3B8'; // slate-400 — visible on white
  slide.addShape('line',{ x:x1, y:y1, w:0,            h:midY-y1, line:{color:lc,width:lw} });
  slide.addShape('line',{ x:Math.min(x1,x2), y:midY, w:Math.abs(x2-x1), h:0, line:{color:lc,width:lw} });
  slide.addShape('line',{ x:x2, y:midY, w:0,           h:y2-midY, line:{color:lc,width:lw} });
}

// Nodes
for (const emp of employees) {
  const n = nodeMap.get(emp.id);
  const nx=toX(n.x), ny=toY(n.y);
  const dc=hex(getDeptColor(emp.department));

  // Card
  slide.addShape('roundRect',{
    x:nx, y:ny, w:nwIn, h:nhIn,
    fill:{color:'FFFFFF'}, line:{color:'CBD5E1',width:lw}, rectRadius:0.08,
  });
  // Dept strip
  slide.addShape('rect',{
    x:nx, y:ny, w:nwIn, h:stripH,
    fill:{color:dc}, line:{color:dc,width:0},
  });

  const px=nx+0.07*scale, tw=nwIn-0.14*scale;
  const top=ny+stripH+0.05*scale;

  slide.addText(emp.name,{
    x:px, y:top, w:tw, h:nhIn*0.38,
    fontSize:nameSz, fontFace:'Arial', bold:true,
    color:'0F172A', align:'left', valign:'top', wrap:false, shrinkText:true,
  });
  slide.addText(emp.title,{
    x:px, y:top+nhIn*0.38, w:tw, h:nhIn*0.32,
    fontSize:titleSz, fontFace:'Arial',
    color:'475569', align:'left', valign:'top', wrap:false, shrinkText:true,
  });
  if (nhIn > 0.5) {
    slide.addText(emp.department,{
      x:px, y:top+nhIn*0.68, w:tw, h:nhIn*0.24,
      fontSize:deptSz, fontFace:'Arial',
      color:dc, align:'left', valign:'top', wrap:false, shrinkText:true,
      margin:[0.03, 0.06, 0.15, 0.06],
    });
  }
}

const out = '/tmp/test-org.pptx';
await pptx.writeFile({ fileName: out });
console.log(`Saved: ${out}`);
