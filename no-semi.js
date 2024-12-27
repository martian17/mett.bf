/*
int value = ...
<type> <name> = <expr>


// tuple literal and tuple type will be parsed together
// and will be unterscheidet von ein ander mit dem inhalt später


// this is a named immediate tuple (struct)
auto result = (
    value,// normal value without type declaration or sonstiges
    value2,
    int name: value,
    name: value, // type is automatically guesstimated
    @"const": value, // reserved keyword can be parsed as a normal token with the use of @""
    (char, char) name: value,
);


type myStruct = (
    type name;
    type name = default;
    name = default;
    // name only struct declaration (without type or default) is not allowed
);


operator [] (<typename> target, <typename> arg) -> <return type name> {

    
}

fn funcname(){
}

// tuple type definition 

// half operator half prefix
// dyn keyword -- treated as a prefix to make an array type dynamic

// prefix for tuples
// 


// when there gibt nur ein Inhalt
(value,)// tuple
(value)// not a tuple


*/