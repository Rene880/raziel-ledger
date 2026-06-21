import fs from 'fs';
const root = '/home/octa/project/raziel-ledger/src/js/';
function load(f){
  let t = fs.readFileSync(root+f,'utf8');
  // drop import lines
  t = t.replace(/^\s*import .*$/gm,'');
  // cut everything from the first top-level `export`
  const i = t.search(/\nexport\s/);
  if(i>=0) t = t.slice(0,i);
  return t;
}
const code = [
  load('supplies-common.js'),
  load('supplies.js'),
  load('supplies-eternals.js'),
  load('supplies-evokers.js'),
  'return { items, groups, ETERNALS_DATA, EVOKERS_DATA };'
].join('\n');
const { items, groups, ETERNALS_DATA, EVOKERS_DATA } = new Function(code)();

// replicate Calculator.getItemProgressFor resolution (refs + per-ref max)
function resolve(item, element, unitKey){
  let refs = [];
  if(item.item){ refs.push(item.item); }
  else if(item.group){
    const g = groups[item.group];
    const v = g.type==='element' ? g[element] : g[unitKey];
    if(Array.isArray(v)) refs = v.slice(); else refs.push(v);
  }
  return refs.map(ref=>{
    let max = item.q/refs.length;
    if(item.q % refs.length > 0){ max = max<5 ? Math.ceil(max) : Math.floor(max); }
    return { ref, max };
  });
}

function totalsFor(data, stepsKey){
  const out = {};
  for(const [unitKey,unit] of Object.entries(data.units)){
    const buf = {};
    for(const step of data[stepsKey]){
      for(const item of step.items){
        for(const {ref,max} of resolve(item, unit.element, unitKey)){
          buf[ref] = (buf[ref]||0) + max;
        }
      }
    }
    out[unitKey] = { name: unit.name, element: unit.element, items: buf };
  }
  return out;
}

const result = {
  CalcEternal: totalsFor(ETERNALS_DATA,'materials'),
  CalcEternalRadiance: totalsFor(ETERNALS_DATA,'radiance'),
  CalcEvoker: totalsFor(EVOKERS_DATA,'materials'),
};

function mdTable(calcLabel, table){
  let s = `## ${calcLabel}\n\n`;
  for(const u of Object.values(table)){
    s += `### ${u.name}  *(${u.element})*\n\n`;
    s += `| Item | Name | Total |\n|---|---|---:|\n`;
    const rows = Object.entries(u.items)
      .sort((a,b)=> (items[a[0]].category-items[b[0]].category) || (a[1]-b[1]));
    for(const [k,q] of rows){
      s += `| \`${k}\` | ${items[k].name} | ${q} |\n`;
    }
    s += `\n`;
  }
  return s;
}

let md = `# Material totals (cached)\n\n`;
md += `Generated from \`src/js/supplies-eternals.js\`, \`supplies-evokers.js\`, and \`supplies.js\`.\n`;
md += `Per unit, full progression (every step, Completed=Nothing → last). Group quantities are\n`;
md += `resolved per unit element/id and split across multi-element refs using the same rounding as\n`;
md += `\`Calculator.getItemProgressFor\` (split <5 ⇒ ceil, ≥5 ⇒ floor). Regenerate with the script below.\n\n`;
md += mdTable('CalcEternal — Recruit & Transcend', result.CalcEternal);
md += mdTable('CalcEternal — Radiance', result.CalcEternalRadiance);
md += mdTable('CalcEvoker', result.CalcEvoker);

fs.writeFileSync('/home/octa/project/raziel-ledger/.claude/item-totals.md', md);
fs.writeFileSync('/home/octa/project/raziel-ledger/.claude/item-totals.json', JSON.stringify(result,null,2));
console.log('eternal units:', Object.keys(result.CalcEternal).length);
console.log('radiance units:', Object.keys(result.CalcEternalRadiance).length);
console.log('evoker units:', Object.keys(result.CalcEvoker).length);
const sample = result.CalcEvoker['2040236'];
console.log('sample Maria items:', Object.keys(sample.items).length);
