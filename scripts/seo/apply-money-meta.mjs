import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
const walk=(d)=>readdirSync(d).flatMap(f=>{const p=join(d,f);return statSync(p).isDirectory()?walk(p):(f.endsWith(".ts")&&f!=="index.ts"?[p]:[]);});
const meta=JSON.parse(readFileSync("reference/seo/money-page-meta.json","utf8"));
const esc=s=>s.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
const unesc=s=>s.replace(/\\"/g,'"').replace(/\\\\/g,"\\");
let done=0; const seen=new Set();
for(const file of walk("src/content/pages")){
  let s=readFileSync(file,"utf8");
  const f=k=>{const m=s.match(new RegExp(`^\\s*${k}:\\s*"((?:[^"\\\\]|\\\\.)*)"`,"m"));return m?unesc(m[1]):"";};
  const locale=f("locale"), slug=f("slug");
  const m=meta[locale]?.[slug]; if(!m) continue;
  const seoM=s.match(/(\n  seo: \{\n)([\s\S]*?)(\n  \},\n)/); if(!seoM) continue;
  const navM=seoM[2].match(/navLabel:\s*\n?\s*"((?:[^"\\]|\\.)*)"/);
  if(m.title.length>60) console.log("WARN title >60:",locale,slug,m.title.length);
  if(m.description.length>160||m.description.length<110) console.log("WARN desc len:",locale,slug,m.description.length);
  s=s.replace(seoM[0], seoM[1]+(navM?`    navLabel: "${esc(unesc(navM[1]))}",\n`:"")+
    `    title: "${esc(m.title)}",\n    description:\n      "${esc(m.description)}",`+seoM[3]);
  writeFileSync(file,s); seen.add(locale+"|"+slug); done++;
}
console.log("money pages written:",done);
for(const loc of ["de","en"]) for(const sl of Object.keys(meta[loc]||{})) if(!seen.has(loc+"|"+sl)) console.log("NOT FOUND:",loc,sl);
