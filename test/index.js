const getFuncVar = require('../index.js')

let listFunc = [
    'a:(c)=>{}',
    '(a,b)=>{}',
]

for (let i = 0; i < listFunc.length; i++) {
    getFuncVar(listFunc[i])
    console.log('good', getFuncVar(listFunc[i]));
}