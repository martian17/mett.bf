export type parser<T> = (str: string) => false | [string, T]

export interface AST{
    type: string,
}

export type parserOutput = string | AST | parserOutput[];

export class Scope implements AST{
    tempNames = new Map;
    varNames = new Map;
    typeNames = new Map;
    body: AST[];
    constructor(public type: string){}
}

export type pattern = string | RegExp | parser<parserOutput>

const parseSingleLineComment: parser<string> = function(str){
    if(str.length < 2)return false;
    if(str.slice(0,2) !== "//")return false;
    for(let i = 2; i < str.length; i++){
        if(str[i] === "\n"){
            return [str.slice(i),str.slice(0,i)];
        }
    }
    return ["",str];
};

const parseMultiLineComment: parser<string> = function(str){
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

const parseSpaceChars: parser<string> = function(str){
    for(let i = 0; i < str.length; i++){
        const c = str[i];
        if(c === " " || c === "\t" || c === "\r" || c === "\n")continue;
        if(i === 0)return false;
        return [str.slice(i),str.slice(0,i)];
    }
    return ["",str];
}

export const consumeSpace = function(str: string): string{
    while(str !== ""){
        let it: [string,string] | false;
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


const regMatch = function(str: string, pat: string | RegExp): string | false{
    const res = str.match(pat);
    if(!res)return false;
    return res[0] as string;
}

type ParserType<T> = 
    T extends string ? parser<string> : 
    T extends RegExp ? parser<string> :
    T extends parser<infer U> ? T : never;

export function getParser<T>(parser: T): ParserType<T>{
    if(typeof parser === "string"){
        return ((str)=>{
            str = consumeSpace(str);
            if(!str.startsWith(parser))return false;
            return [str.slice(parser.length),parser as string];
        }) as ParserType<T>;
    }else if(parser instanceof RegExp){
        return ((str)=>{
            str = consumeSpace(str);
            const match = regMatch(str,parser)
            if(!match)return false;
            return [str.slice(match.length),match];
        }) as ParserType<T>;
    }
    return parser as ParserType<T>;
};

export const or = function<T extends pattern>(...parsers: T[]): ParserType<T>{
    return ((str: string)=>{
        for(let parser of parsers){
            let it: ReturnType<ParserType<T>>;
            if(it = getParser(parser)(str) as ReturnType<ParserType<T>>)return it;
        }
        return false;
    }) as ParserType<T>;
};

type PatternType<T extends pattern> = Exclude<ReturnType<ParserType<T>>,false>[1];
type MapParserTypes<T extends any[]> = {
    [K in keyof T]: PatternType<T[K]>;
};

export const seq = function<T extends pattern[]>(...parsers: T): parser<MapParserTypes<T>>{
    return ((str: string)=>{
        let res: any[] = [];
        for(let parser of parsers){
            let it: any;
            if(!(it = getParser(parser)(str)))return false;
            let r;
            [str,r] = it;
            res.push(r);
        }
        return [str,res];
    }) as parser<MapParserTypes<T>>
};

//const res = seq("1",/asdf/, (()=>{}) as unknown as parser<AST>)

export const listLike = function<T extends pattern>(start: pattern, separator: pattern, end: pattern, _matcher: T): parser<PatternType<T>[]>{
    return ((str: string)=>{
        const matcher = getParser(_matcher);
        let res: (AST | string)[] = [];
        let it: any;
        if(!(it = getParser(start)(str)))return false;
        [str] = it;
        let nosep = false;
        while(str !== ""){
            if(!(it = matcher(str)))break;
            if(nosep)return false;
            let match: AST | string;
            [str,match] = it;
            if(it = getParser(separator)(str)){
                [str] = it;
            }else{
                nosep = true;
            }
            res.push(match);
        }
        if(!(it = getParser(end)(str)))return false;
        [str] = it;
        return [str,res];
    }) as parser<PatternType<T>[]>;
};

//const a = listLike("","","", "" as unknown as parser<AST>);

