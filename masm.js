/*
Language constructs in masm
#loop(){...}
#seek(l1, l2)
v++
v--
#read(v)
#write(v)

char if_flg;
char else_flg;
if_flg := flag;
#loop(flag){
    flag--;
    else++;
}
#loop(else){
}


ifzero(v){
   ...
}else{
   ...
}

// Rule 1, type type cannot be a teil von struct/tuple sein
const u8 = (char, cahr, char, char, char, char, char, char);
const u8 = [8]char;

someFunc(typeSize: compInt){
    for(var i: compInt = 0; i < ){
    }
    return [typeSize]char;
}

type tuple
const a = (char, char, char) --- represented as (char, char, char)

type (b, c, d) = a
b c d ... char

const e: a = ('a', 'b', 'c')

struct {
    ... struct type definition
}

(tuple)
// tuple
(char, char, char)
// named tuple
(int: char, aas: char)

return (char, char, char)


// error: XXX cannot be used as type, as it contains a real value

// How type is expressed
var name: ... = ...
val name = (a, b, c)// tuple
val object = {
    name = value,
    name = value,
    name = value,
}

// struct definition
{
    name: type = xxx,// default value
    name = xxx,// default value decides the type
    name: type,
}
// immediate object
{
    .name = value,
    .name = value,
}
// typed struct initialization
structName {
    .name: type = value,
    .name = value,
}



_({
    a: aaa,// key value pair or type definition
    b: bbb,
})

struct literal ({
    name: value,
    name: value,
    name: value,
})

[]

{
    a: asdf = 1,
}





fn createAddFunction(intType: type){
    const size: compInt = @sizeof(intType);
    return fn add(a: intType, b: intType){
        var c: intType = a;
        var carry: char;
        var carryNext: char;
        @for(var i: compInt = 0; i < size; i++){// comparison operator: "cannot compare xxx against yyy"
            @loop(a[i]){
                c[i]++;
                @loop(b[i]){
                    c[i]--;
                    @loop(carry){
                        c[i]++;
                        carry = 0;
                    }
                    b[i] = 0;
                    carryNexty++;
                }
                @loop(carry){
                    c[i]--;
                    carry = 0;
                }
                a[i] = 0;
            }
            @loop(b[i]){
                c[i]++;
                @loop(carry){
                    c[i]--;
                    carry = 0;
                    carryNexty++;
                }
                b[i] = 0;
            }
            @loop(carry){
                c[i]++;
                carry = 0;
            }
            @mov(carryNext, carry);
        }
        return c;
    }
}

someFunc(8)



// char[8] can ambiguity verursachen
someFunc(a, b, char[8]){// jetzt ist es ein value
}

someFunc(a, b, [8]char){// jetzt ist es ein typ
}





fn name <T1, T2...> ( args ) -> ret{
}

dyn int[]

"any" type should act as a generic

everything as expression

fn asdf(a: any, b: (int, float) -> float){
    res: float = 5.1;
    for(i: int = 2, i < 10; i++){
        res += b(i, res)
    }
    return res;
}

// passing a function, type, or constant will make it into a generic function
// it will be resolved for every call sites
fn asdf(a: any, b: (int, float) -> float){
    res: dyn float[] = [5.1];
    for(i: int = 2, i < 10; i++){
        res.push(b(i, res));
    }
    return res;
}

// @ denotes a generic type, it is called "generic type marker"

fn asf(a: {k: @T1}, b: {k: @T1}, logger: @T2) -> T2 {
    return logger.log(a.k.stringify() + b.k.stringify())
}

type a = type (
    name: type,
    type,
    fn methodName(){
    }
    @"+"
    @"[]"
)

// could be seen as returning a type
return (item1, item2)

return 

operator [] (original){
} 

structure der type expression
1. dynamic prefix (dyn ...)
2. simple name (id)
3. array (id[expression?])
4. tuple (a: type, type, type)
6. 

Basic structure of the language
type id = 

*/

class ParseState{
    position = 0;
    str = "";
    static fromString(str, position = 0){
        const state = new ParseState();
        state.str = str;
        state.position = position;
        return state;
    }
    slice(){
        return this.str.slice(this.position);
    }
    matchesHelper(s){//string or regex
        const pos = this.position;
        const str = this.string;
        if(s instanceof RegExp){
            const regex = new RegExp(`^(${s.source})`, s.flags);
            const res = str.slice(pos).match(regex);
            if(!res)return false;
            const match = res[0];
            this.position += match.length;
            return match;
        }else{
            for(let i = 0; i < s.length; i++){
                if(str[pos+i] !== s[i]){
                    return false;
                }
            }
            this.position += s.length;
            return s;
        }
    }
    clone(){
        return ParseState.fromString(this.str,this.position);
    }
    restore(state){
        this.position = state.position;
    }
    skipSpaces(){
        const str = this.str;
        while(true){
            if(this.matchesHelper("//")){
                this.matchesHelper(/[^\n]*($|\n)/);
            }else if(this.matchesHelper("/*")){
                const match = this.slice().match(/\*\//);
                if(!match){
                    this.position = str.length;// define error handling later on
                    return;
                }
                this.position += (match.index+2);
            }else if(this.matchesHelper(/[\s]+|$/)){
                // already skipped
            }else{
                return true;
            }
        }
    }
    lastMatch = "";
    matches(s){
        this.lastMatch = this.matchesHelper();
        this.skipSpaces();
        return this.lastMatch;
    }
    peekMatches(s){
        const pos = this.position;
        this.lastMatch = this.matchesHelper();
        this.position = pos;
        return this.lastMatch;
    }
    matchesId(){
        return this.matches(/[a-zA-Z_][a-zA-Z_0-9]*/);
    }
}

class ParseError{
    message = "";
    isPrseError = true;
}

const parseArguments = function(state){
    const state0 = state.clone();
    if(!state.matches("<") && state.restore(state0)) return false;
    const result = {
        type: "arguments",
        args: [],
    };
    const args = result.args;
    while(true){
        if(parseExpression(state)){
            const [result, error] = parseExpression();
            if(result)
        }
    }

}

const parseParameters = function(state){
    const state0 = state.clone();
    if(!state.matches("(") && state.restore(state0)) return false;
    const result = {
        type: "parameters",
        args: [],
    };
    const args = result.args;
    while(true){
        if(parseExpression(state)){
            const [result, error] = parseExpression();
            if(result)
        }
    }

}


const parseExpression = function(state){

}

// expressions
// function expression
// class expression
// type expression
// if - else if -- else expression
// no generics (type as argument)
// let type (generic)

/*
fn add<T>(T a, T b) -> T {
    return a + b;
}
*/

const parseType = function(state){
    // dyn type
    // simple name
    // tuple
    // accessor
    // T>value
    if(state.matchesId()){
        if(state.lastMatch === "dynamic"){
            const [result,error] = parseType(state);
            if(error)return [result, error];
            if(result.type !== "array-type"){
                return [null, {
                    state,
                    message: "Expected an array type after dynamic modifier"
                }]
            }
            result.dynamic = true;
            return [result, null];
        }if(state.peekMatches("[")){
            // array type
            // the content can be a general expression, as I am planning to implement comptime expression
            // but for now, it is as type and constant begrenzt.

            
        }else if(state.peekMatches("<")){
            // generic type
            parseGenericArguments();
        }else if(state.peekMatches(".")){
            // type accessor
        }

    }

}

const parseFuncdef = function(state){


}

const parseGlobal = function(state){
    for(;;){
        parseLine();
    }
}
