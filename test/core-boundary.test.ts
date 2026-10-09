import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import ts from 'typescript';
import * as core from '../src/core.ts';

// The compiler's syntax tree inventories imports, including re-exports; text in
// a comment or string cannot hide a real dependency or invent one.
function closure(entry:string,load:(path:string)=>string):string[] {
  const seen=new Set<string>();
  const visit=(path:string):void=>{
    if(seen.has(path))return;
    seen.add(path);
    const source=ts.createSourceFile(path,load(path),ts.ScriptTarget.Latest,true);
    const walk=(node:ts.Node):void=>{
      if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)
        throw Error(`dynamic import in pure core: ${path}`);
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier){
        assert.ok(ts.isStringLiteral(node.moduleSpecifier));
        const name=node.moduleSpecifier.text;
        if(name.startsWith('node:'))throw Error(`host import in pure core: ${name}`);
        // A type-only dependency contributes no runtime edge.
        const typeOnly=ts.isImportDeclaration(node)?node.importClause?.isTypeOnly:node.isTypeOnly;
        if(!typeOnly){
          if(!name.startsWith('.'))throw Error(`unresolved runtime dependency in pure core: ${name}`);
          visit(resolve(dirname(path),name));
        }
      }
      ts.forEachChild(node,walk);
    };
    walk(source);
  };
  visit(entry);
  return [...seen].sort();
}

test('the pure core closes transitively without host or opaque runtime imports',()=>{
  const entry=new URL('../src/core.ts',import.meta.url).pathname;
  const paths=closure(entry,path=>readFileSync(path,'utf8'));
  assert.ok(paths.includes(new URL('../src/wire/values.ts',import.meta.url).pathname));
  assert.ok(paths.includes(new URL('../src/wire/outcome.ts',import.meta.url).pathname));
  assert.equal(core.canonical({value:'none',scope:'example'}),'bound-lock/1 scope=example value=none');
});

test('the inventory detects a transitive host edge and dynamic loading',()=>{
  for(const text of ["export {readFile} from 'node:fs';","import('node:fs');"]){
    assert.throws(()=>closure('/core.ts',path=>path==='/core.ts'?"export * from './other.ts';":text),/host import|dynamic import/);
  }
  assert.deepEqual(closure('/core.ts',()=>"// import 'node:fs'\nexport const description = \"import('node:fs')\";"),['/core.ts']);
});
