// Static audit over the content registry: parses each page .ts file's literal
// fields with a regex pass (no TS toolchain needed) and reports SEO defects.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src/content/pages";
function walk(d){return readdirSync(d).flatMap(f=>{const p=join(d,f);return statSync(p).isDirectory()?walk(p):(f.endsWith(".ts")&&f!=="index.ts"?[p]:[]);});}

const pages = [];
for (const f of walk(ROOT)) {
  const s = readFileSync(f,"utf8");
  const pick = (k)=>{const m=s.match(new RegExp(`^\\s*${k}:\\s*"((?:[^"\\\\]|\\\\.)*)"`,"m"));return m?m[1]:undefined;};
  const id=pick("id"), locale=pick("locale"), slug=pick("slug"), h1=pick("h1"), type=pick("type");
  const seoBlock = s.match(/seo:\s*\{([\s\S]*?)\n  \}/);
  const sb = seoBlock?seoBlock[1]:"";
  const g=(k)=>{const m=sb.match(new RegExp(`${k}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));return m?m[1]:undefined;};
  const words = (s.match(/text:\s*"((?:[^"\\]|\\.)*)"/g)||[]).map(x=>x.length).reduce((a,b)=>a+b,0);
  const imgs = [...s.matchAll(/kind:\s*"image"[^}]*?alt:\s*"((?:[^"\\]|\\.)*)"/g)].map(m=>m[1]);
  const imgCount = (s.match(/kind:\s*"image"/g)||[]).length;
  pages.push({file:f,id,locale,slug,type,h1,title:g("title"),desc:g("description"),
    approxChars:words, imgCount, emptyAlt: imgs.filter(a=>!a.trim()).length,
    h2s:(s.match(/level:\s*2/g)||[]).length});
}
const by=(k)=>pages.reduce((m,p)=>((m[p[k]]=(m[p[k]]||0)+1),m),{});
console.log("TOTAL", pages.length, JSON.stringify(by("locale")), JSON.stringify(by("type")));

const issue=(name,list)=>{console.log(`\n## ${name}: ${list.length}`);list.slice(0,12).forEach(p=>console.log("  -",p.locale,p.slug,"|",(p.title||"(none)").slice(0,70)));};

issue("Missing title", pages.filter(p=>!p.title));
issue("Missing description", pages.filter(p=>!p.desc));
issue("Title > 60 chars", pages.filter(p=>p.title&&p.title.length>60));
issue("Title < 30 chars", pages.filter(p=>p.title&&p.title.length<30));
issue("Desc outside 120-160", pages.filter(p=>p.desc&&(p.desc.length<120||p.desc.length>160)));
issue("Desc truncated mid-word (no terminal punctuation)", pages.filter(p=>p.desc&&!/[.!?»"]$/.test(p.desc.trim())));
issue("Missing h1", pages.filter(p=>p.type!=="homepage"&&!p.h1));
issue("Thin content (<1500 chars)", pages.filter(p=>p.type==="post"&&p.approxChars<1500));
issue("Images with empty alt", pages.filter(p=>p.emptyAlt>0));

const dupT={}; pages.forEach(p=>{if(p.title)(dupT[p.locale+"|"+p.title] ||= []).push(p);});
const dt=Object.entries(dupT).filter(([,v])=>v.length>1);
console.log(`\n## Duplicate titles within a locale: ${dt.length} groups`);
dt.slice(0,10).forEach(([k,v])=>console.log("  -",k.slice(0,80),"=>",v.map(p=>p.slug).join(", ").slice(0,140)));

const dupD={}; pages.forEach(p=>{if(p.desc)(dupD[p.locale+"|"+p.desc] ||= []).push(p);});
const dd=Object.entries(dupD).filter(([,v])=>v.length>1);
console.log(`\n## Duplicate descriptions within a locale: ${dd.length} groups`);
dd.slice(0,8).forEach(([k,v])=>console.log("  -",k.slice(0,70),"=>",v.map(p=>p.slug).join(", ").slice(0,120)));

// title == description (WordPress auto-fill smell)
issue("Description duplicates the intro/title verbatim", pages.filter(p=>p.desc&&p.title&&p.desc.startsWith(p.title.replace(/ \| Dietz GmbH$/,""))));
