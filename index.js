const esprima = require('esprima')

const reComments = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg

module.exports = function getFuncParamsName(func) {
    console.log('初始化', func);
    let str
    if (typeof func === 'function') str = func.toString()
    else if (typeof func === 'string') str = func
    else throw new Error('func type error!')
    let astEsprima
    try {
        try {
            astEsprima = esprima.parseScript(str)
            console.log('a', astEsprima);
        } catch (e) {
            try {
                astEsprima = esprima.parseScript('let x=' + str)
            } catch (e) {
                astEsprima = esprima.parseScript('let x=function ' + str)
            }
        }
    } catch (e) {
        throw new Error('can not parse the parameters')
    }

    let node = astEsprima.body[0]
    let funcParams = []
    let newExpressParms = []

    if (node.type === "ExpressionStatement") node = node.expression
    if (node.type === "VariableDeclaration") node = node.declarations[0].init
    if (node.type === "AssignmentExpression") node = node.right
    if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
        node = node.body.body
        for (let i = 0; i < node.length; i++)
            if (node[i].kind === "constructor") {
                node = node[i].value;
                break
            }
    }
    // 5
    if (node.type === "NewExpression" || node.type === "CallExpression") newExpressParms = node.arguments
    // 6
    if (['FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].includes(node.type)) {
        funcParams = node.params
    }
    let validParam = []

    function iterParam(funcParams) {
        let validP = []
        funcParams.forEach(o => {
            // loop to find 'Identifier'
            while (o.type !== 'Identifier') {
                // if o is Array, break and start new loop
                if (Array.isArray(o) && o.length) return validP.push(iterParam(o))
                // like ([a,b]=[1,2])
                if (o.type === "ArrayPattern") o = o.elements
                // like ({x,y}={x:1,y:2})
                else if (o.type === "ObjectPattern") o = o.properties
                // like ([...params])
                else if (o.type === "RestElement") {
                    o = o.argument
                    o.name = '...' + o.name
                    // exist [a,b] or {x,y}, here first, then 'ArrayPattern' or 'ObjectPattern'
                } else if (o.type === "Property") o = o.key
                // like (x=a)
                else o = o.left
            }
            validP.push(o.name)
        })
        return validP
    }

    if (funcParams.length) {
        validParam = iterParam(funcParams)
    } else {
        // 针对 new Function的参数，
        newExpressParms.slice(0, -1).forEach(o => {
            let param = o.value.replace(reComments, '')
            param = param.split('=')[0]
            if (param) validParam.push(param)
        })
    }
    return validParam.filter(Boolean)
}