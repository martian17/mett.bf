let parseSingleLineComment = function(str){
    if(str.length < 2)return false;
    if(str.slice(0,2) !== "//")return false;
    for(let i = 2; i < str.length; i++){
        if(str[i] === "\n"){
            return [str.slice(i),str.slice(0,i)];
        }
    }
    return ["",str];
};

let parseError;

const parseMultiLineComment = function(str){
    if(str.length < 4)return false;
    if(str.slice(0,2) !== "/*")return false;
    for(let i = 2; i < str.length-1; i++){
        if(str.slice(i,i+2) === "*/"){
            return [str.slice(i+1),str.slice(0,i+1)];
        }
    }
    // should throw an error, but doesnt matter
    return ["",str];
}

const parseSpaceChars = function(str){
    for(let i = 0; i < str.length; i++){
        const c = str[i];
        if(c === " " || c === "\t" || c === "\r" || c === "\n")continue;
        if(i === 0)return false;
        return [str.slice(i),str.slice(0,i)];
    }
    return ["",str];
}

let parseSpace = function(str){
    while(str !== ""){
        let it;
        if(it = parseSpaceChars(str)){
            str = it[0];
        }else if(it = parseSingleLineComment(str)){
            str = it[0];
        }else if(it = parseMultiLineComment(str)){
            str = it[0];
        }else{
            return str;
        }
    }
    return "";
}

let parseSpaceStrict = function(str){
    let it;
    while(str.length !== 0){
        if(it = parseSpaceChars(str)){
            str = it[0];
        }else if(it = parseSingleLineComment(str)){
            str = it[0];
        }else if(it = parseMultiLineComment(str)){
            str = it[0];
        }else{
            if(it)return str;
            return false;
        }
    }
    if(it)return "";
    return false;
}

let matchSlice = function(str,pat){
    return normalizeParser(pat)(str);
}

const normalizeParser = function(parser){
    if(typeof parser === "string"){
        return (str)=>{
            str = parseSpace(str);
            if(!str.startsWith(parser))return false;
            return [str.slice(parser.length),parser];
        }
    }else if(parser instanceof RegExp){
        return (str)=>{
            str = parseSpace(str);
            let match = str.match(parser);
            if(!match)return false;
            match = match[0];
            return [str.slice(match.length),match];
        }
    }
    return parser;
};

const parseRepeats = function(start,separator,end,matcher){
    return (str)=>{
        matcher = normalizeParser(matcher);
        let res = [];
        let it;
        if(!(it = matchSlice(str,start)))return false;
        [str] = it;
        let nosep = false;
        while(str !== ""){
            if(!(it = matcher(str)))break;
            if(nosep)return false;
            let match;
            [str,match] = it;
            if(it = matchSlice(str,separator)){
                [str] = it;
            }else{
                nosep = true;
            }
            res.push(match);
        }
        if(!(it = matchSlice(str,end)))return false;
        [str] = it;
        return [str,res];
    };
};

const or = function(...parsers){
    return (str)=>{
        for(let parser of parsers){
            let it;
            if(it = normalizeParser(parser)(str))return it;
        }
        return false;
    }
};


const seq = function(...parsers){
    return (str)=>{
        let res = [];
        for(let parser of parsers){
            let it;
            if(!(it = normalizeParser(parser)(str)))return false;
            let r;
            [str,r] = it;
            res.push(r);
        }
        return [str,res];
    }
};

const wrap = function(fn,...args){
    return (str)=>{
        return fn(str,...args)
    }
};

const reg = {
    id: /^[A-Za-z_][A-Za-z0-9_]*/,
    int: /^[0-9]+/,
    op: /^(\+|\-|\*|\/|%|\+=|\-=|\*=|\/=|%=|\*\*=|==|===|!=|!==|>|<|>=|<=|&&|\|\||!|&|\||\^|~|<<|>>|>>>|\?|:)/,
}

const parseTupleDefinition = function(str){
    let it = parseRepeats("(",",",")",(str)=>{
        let it;
        if(!(it = parseTypeDefinition(str)))return false;
        let typedef;
        [str,typedef] = it;
        let slot = [typedef,null];
        if(it = matchSlice(str,reg.id)){
            let typename;
            [str,typename] = it;
            slot[1] = typename;
        }
        return [str,slot]
    })(str);
    if(!it)return false;
    let items;
    [str,items] = it;
    return [str,{
        type: "tupleTypedef",
        items: items,
    }];
};

const parseTypeDefinition = function(str){
    let it;
    it = or(
        (str)=>{
            let it;
            if(!(it = matchSlice(str,reg.id)))return false;
            let id;
            [str,id] = it;
            // match for template
            let tempargs = null;
            if(it = parseRepeats("<",",",">",parseTypeDefinition)(str)){
                [str,tempargs] = it;
            }
            return [str,{
                type: "aliasTypedef",
                name: id,
                tempargs: tempargs,
            }];
        },
        parseTupleDefinition
    )(str);
    if(!it)return false;
    let typedefMain;
    [str,typedefMain] = it;
    // might be an array
    if(it = seq(
        "[",
        or(reg.int,reg.id),
        "]"
    )(str)){
        let r;
        [str,r] = it;
        const size = r[1];
        return [str,{
            type: "arrayTypedef",
            size: size,
            content: typedefMain
        }]
    }
    return [str,typedefMain];
};

const parseTypedefStatement = function(str){
    let it;
    if(!(it = seq("typedef",reg.id,parseTypeDefinition)(str)))return false;
    let id,type,_;
    [str,[_,id,type]] = it;
    return [str,{
        type: "typedef",
        name: id,
        typedef: type,
    }];
};

const parseDeclaration = function(str){
    let it;
    if(!(it=seq(parseTypeDefinition,reg.id)(str)))return false;
    let type,id;
    [str,[type,id]] = it;
    let _,expr;
    if(it=seq("=",parseExpression)(str)){
        [str,[_,expr]] = it;
    }
    return [str,{
        type: "vardec",
        vartype: type,
        name: id,
        expr: expr || null,
    }];
}


let prefixes = new Map;
let postfixes = new Map;
let binaries = new Map;

`
bl .
po CALL INDEX TEMPL
po ++ --
pr ++ -- ! + -
bl * / %
bl + -
bl < > <= >= == !=
br = *= /= += -=
`.trim().split("\n").map((line,i)=>{
    const [type,...ops] = line.split(" ");
    let map;
    if(type === "pr")map = prefixes;
    if(type === "po")map = postfixes;
    if(type === "bl")map = binaries;
    if(type === "br")map = binaries;
    const pr = -i*2;
    for(let op of ops){
        map.set(op,{
            precedence: pr,
            stackPrecedence: type === "br" ? pr-1 : pr+1,
        });
    }
});

const getMatcher = function(map){
    const keys = [...map.keys()].sort((a,b)=>b.length-a.length);
    let regexstrs = [];
    for(let key of keys){
        if(key.match(/^[A-Z]/))continue;
        regexstrs.push("\\"+key.split("").join("\\"));
    }
    //console.log("^"+regexstrs.join("|"));
    return normalizeParser(new RegExp("^("+regexstrs.join("|")+")"));
};

const prefixMatcher = getMatcher(prefixes);
const postfixMatcher = getMatcher(postfixes);
const binaryMatcher = getMatcher(binaries);


const parsePrefix = function(str){
    let it;
    if(it = prefixMatcher(str)){
        let op;
        [str,op] = it;
        return [str,{
            type: "operator",
            opType: "prefix",
            op: op
        }];
    }
    return false;
};

const parsePostfix = function(str){
    let it;
    if(it = postfixMatcher(str)){
        let op;
        [str,op] = it;
        return [str,{
            type: "operator",
            opType: "postfix",
            op: op
        }];
    }else if(it = parseRepeats("<",",",">",parseTypeDefinition)(str)){
        let args;
        [str,args] = it;
        return [str,{
            type: "operator",
            opType: "postfix",
            op: "TEMPL",
            args: args,
        }];
    }else if(it = parseRepeats("(",",",")",parseExpression)(str)){
        let args;
        [str,args] = it;
        return [str,{
            type: "operator",
            opType: "postfix",
            op: "CALL",
            args: args,
        }];
    }else if(it = seq("[",parseExpression,"]")(str)){
        let args;
        [str,args] = it;
        return [str,{
            type: "operator",
            opType: "postfix",
            op: "INDEX",
            args: args,
        }];
    }
    return false;
};

const parseBinary = function(str){
    let it;
    if(it = binaryMatcher(str)){
        let op;
        [str,op] = it;
        return [str,{
            type: "operator",
            opType: "binary",
            op: op
        }];
    }
    return false;
}

const parseOperand = function(str){
    let it;
    if(it = normalizeParser(reg.id)(str)){
        [str,it] = it;
        let value = it;
        return [str,{
            type: "id",
            id: value,
        }];
    }else if(it = normalizeParser(reg.int)(str)){
        [str,it] = it;
        let value = it;
        return [str,{
            type: "int",
            value: value,
        }]
    }else if(it = seq("'",/^(\\'|[^'])+/,"'")(str)){
        [str,it] = it;
        let value = it[1];
        return [str,{
            type: "char",
            value: value,
        }];
    }else if(it = seq('"',/^(\\"|[^"])+/,'"')(str)){
        [str,it] = it;
        let value = it[1];
        return [str,{
            type: "string",
            value: value,
        }];
    }else if(it = seq("(",parseExpression,")")(str)){
        [str,it] = it;
        let value = it[1];
        return [str,{
            type: "group",
            value: value,
        }];
    }else{
        return false;
    }
};

const parseExpression = function(str){
    // operators, function calls, literals, variables

    // (operand includes parenthesis)
    // start   -> prefix, operand, end
    // prefix  -> prefix, operand
    // binary  -> prefix, operand
    // operand -> postfix, binary, end
    // postfix -> postfix, binary, end
    let state = "start";
    let operators = [];
    let tokens = [];

    const reduceStack = function(p){
        if(operators.length === 0)return;
        const op = operators.at(-1);
        if(op.opType === "prefix"){
            if(prefixes.get(op.op).stackPrecedence < p)return;
            const operand = tokens.pop();
            op.value = operand;
            operators.pop();
            tokens.push(op);
        }else if(op.opType === "postfix"){
            if(postfixes.get(op.op).stackPrecedence < p)return;
            const operand = tokens.pop();
            op.value = operand;
            operators.pop();
            tokens.push(op);
        }else if(op.opType === "binary"){
            if(binaries.get(op.op).stackPrecedence < p)return;
            const right = tokens.pop();
            const left = tokens.pop();
            op.left = left;
            op.right = right;
            operators.pop();
            tokens.push(op);
        }
        reduceStack(p);
    }

    const takeSnapshot = function(){
        return {
            str,
            operators: [...operators],
            tokens: [...tokens],
        }
    }

    let snapshot = false;

    while(state !== 2){
        let it;
        if(state === "start" || state === "prefix" || state === "binary"){
            let state0 = state;
            if(it = or(parseOperand, parsePrefix)(str)){
                let token;
                [str,token] = it;
                if(token.opType === "prefix"){
                    state = "prefix";
                    reduceStack(prefixes.get(token.op).precedence);
                    operators.push(token);
                }else{
                    state = "operand";
                    tokens.push(token);
                    snapshot = takeSnapshot();
                }
            // }else if(state0 === "start"){
            //     break;
            }else{
                if(!snapshot)return false;
                ({str,tokens,operators} = snapshot);
                break;
            }
        }else if(state === "operand" || state === "postfix"){
            if(it = or(parsePostfix, parseBinary)(str)){
                let token;
                [str,token] = it;
                if(token.opType === "postfix"){
                    state = "postfix";
                    reduceStack(postfixes.get(token.op).precedence);
                    operators.push(token);
                    snapshot = takeSnapshot();
                }else if(token.opType === "binary"){
                    state = "binary";
                    reduceStack(binaries.get(token.op).precedence);
                    operators.push(token);
                }else{
                    console.log("Cannot happen");
                }
            }else{
                break;
            }
        }
    }
    reduceStack(-Infinity);
    return [str,tokens.pop()];
}

const parseStatement = function(str){
    let it;
    let macro = false;
    if(!(it = seq(/^#?[A-Za-z_][A-Za-z_0-9]*/)(str)))return false;
    let id;
    [str,[id]] = it;
    let IDK;
    if(id === "#unroll"){
        // these expression would have different scope (comptime scope), and evaluated in comptime
        if(!(it = seq("(",reg.id,"in",parseExpression,"..",parseExpression,")")(str)))return false;
        [str,it] = it;
        const index = it[1];
        const min = it[3];
        const max = it[5];
        if(!(it = parseScope(str)))return false;
        let body;
        [str,body] = it;
        return [str,{
            type: "#unroll",
            index,min,max,body
        }]
    }else if(id === "#if" || id === "loop"){
        if(!(it = seq("(",parseExpression,")")(str)))return false;
        [str,it] = it;
        let cond = it[1];
        if(!(it = parseScope(str)))return false;
        let body;
        [str,body] = it;
        return [str,{
            type: id,// #if or loop
            cond: cond,
            body: body,
        }];
    }else if(id === "return"){
        if(!(it = parseExpression(str)))return false;
        [str,it] = it;
        const expr = it;
        return [str,{
            type: "return",
            value: expr,
        }];

    }else{
        return false;
    }
}

const parseScope = function(str){
    return parseRepeats("{",/^;?/,"}",or(parseStatement,parseExpression,parseDeclaration))(str);
}

const parseFuncDef = function(str){
    let it,rettype;
    if(!(it = parseTypeDefinition(str)))return false;
    [str,rettype] = it;
    // now match the function name
    if(!(it = matchSlice(str,reg.id)))return false;
    let funcname;
    [str,funcname] = it;
    let op = null;
    let tempargs = null;
    if(funcname === "operator"){
        if(!(it = matchSlice(str,reg.op)))return false;
        [str,op] = it;
    }else if(it = parseRepeats("<",",",">",reg.id)(str)){
        [str,tempargs] = it;
    }
    // now parsing arguments
    if(!(it = parseRepeats("(",",",")",(str)=>{
        let it;
        if(!(it = parseTypeDefinition(str)))return false;
        let type;
        [str,type] = it;
        if(!(it = matchSlice(str,reg.id)))return false;
        let name;
        [str,name] = it;
        return [str,[type,name]];
    })(str)))return false;
    let args;
    [str,args] = it;
    // now parsing function body
    if(!(it = parseScope(str)))return false;
    let body;
    [str,body] = it;
    return [str,{
        type: "funcdef",
        rettype,
        name: funcname,
        args,
        op,
        tempargs,
        body,
    }]
}

export const parseGlobal = function(str){
    let res = parseRepeats("","",
        ""
        //or(parseSingleLineComment,parseMultiLineComment,parseSpaceChars)
        ,or(parseTypedefStatement,parseFuncDef))(str);
    if(!res)return false;
    return {
        type: "global",
        body: res
    }
}

// console.log(JSON.stringify(parseGlobal(`
// typedef u4 (char first, char, (char<ad>[10] a, char b) third, cahr)
// (char char) add<T> (t a, char b){
//     #unroll(i in 0..10){
//         #if(i){
//             // do something
//         }
//     }
// }
//
// void add(){
//     a * b + - c++ * - d.e[5+2]<char>(2)
// }
// (char, char) add(){}
// `)[1],null,4));



// console.log(JSON.stringify(parseGlobal(`
// typedef u8 (char, char, char, char, char, char, char, char)
// u8 operator + (u8 a, u8 b){
//      u8 c;
//      #unroll(i in 0..8){
//          char acc;
//          acc += b[i];
//          loop(acc){
//              acc--;
//              loop(acc){
//                  acc--;
//                  loop(acc){
//                      acc--;
//                      c[i]++;
//                  }
//                  c[i]--;
//                  #if(i != 7){
//                      c[i+1]++;
//                  }
//              }
//              c[i]++;
//          }
//      };
//      k++;
//      return c;
// }
// `)[1],null,4));


//console.log(JSON.stringify((parseExpression)("c.slice(0,8)"),null,4));

//console.log(seq("(",reg.id,"in",parseExpression,"..",parseExpression,")")("(i in 0..8)"));
