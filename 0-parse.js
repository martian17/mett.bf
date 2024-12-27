/*
// tuple return type

typedef u8 (char, char, char, char, char, char, char, char);
typedef u8 (
    char first,
    char second,
    char third,
    char fourth,
    char fifth,
    char sixth,
    char seventh,
    char eighth
)

typedef ur_mom <T> (
    char[10] firstName,
    cahr[10] lastName,
    T age,
    T weight,
)

typedef ur_dad ur_mom<u8>[10];

typedef asdf {
    char a;
    int b;
    float c;
}

macro mov(char a, char b){
    #loop(a){
        a--;
        b++;
    }
}

char operator + (char a, char b){
    char tmp;
    char res;
    #loop(a){
        a--;
        tmp++;
        res++;
    }
    #mov(tmp,a);
    #loop(b){
        b--;
        res++;
        tmp++;
    }
    #mov(tmp,b)
}

macro if(char cond){if_branch}else{else_branch}{
    char else;
    #loop(cond){
        cond = 0;
        flag = 1;
        #{if_branch}
    }
    #loop(else){
        flag = 0;
        #{else_branch}
    }
}

macro if(char cond){if_branch}else{else_branch}{
    char else;
    #loop(cond){
        cond = 0;
        flag = 1;
        #{if_branch}
    }
    #loop(else){
        flag = 0;
        #{else_branch}
    }
}

char main(){
    char a = 1;
    #if(a){
        
    }else{
    }
}

T add<T>(T a, T b){
    T c;
    #unroll(i in 0..sizeof(T)){
        char acc;
        acc += a[i];
        acc += b[i];
        loop(acc){
            acc--;
            loop(acc){
                acc--;
                loop(acc){
                    acc--;
                    c[i]++;
                }
                c[i]--;
                #if(i != 9){
                    c[i+1]++;
                }
            }
            c[i]++;
        }
    }
    return c;
}


typedef u8 (char, char, char, char, char, char, char, char);
u8 operator + (u8 a, u8 b){
    u8 c;
    #unroll(i in 0..8){
        char acc;
        acc += a[i];
        acc += b[i];
        loop(acc){
            acc--;
            loop(acc){
                acc--;
                loop(acc){
                    acc--;
                    c[i]++;
                }
                c[i]--;
                #if(i != 7){
                    c[i+1]++;
                }
            }
            c[i]++;
        }
    }
    return c.slice(0,8);
}


(a, b) funcname(type arg){
    
}


*/


const parse = {
    function(str){
        
    },
    global(str){
    }
}



// const parse = function(str){
//     while(true){
//         parse
//     }
// }
