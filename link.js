import {parseGlobal} from "./parse.js";

const scopeTypes = new Set(`
    global
    funcdef
    loop
    #unroll
    #if
`.trim().split(/\s+/));

const bindToScope = function(ast,scope){
    // assign scope properties (should have been done earlier aber scheißegal)
    if(scopeTypes.has(ast.type)){
        ast.names = {
            temp: new Map,
            var: new Map,
            type: new Map,
        }
    }
    if(ast.type === "global"){
        for(let item of ast.items){
            bindToScope(item,ast);
        }
    }
}

const link = function(ast,scope){
    // link the declaration and usage of names
    // names include functions, types, constants, and variables
    if(ast.type === "global"){
        for(let item of items){

        }
        const global = ast;
        // each scope contains three types of namespaces
        // type, 
    }
}

