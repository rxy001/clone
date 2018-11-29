# clone （未详细测试， 可以有bug o(╥﹏╥)o）
本仓库是 lodash baseClone的源码分析 ，可浅拷贝和深拷贝， 解决JSON.parse(JSON.stringify()) 的一些问题 如

1. 无法拷贝Function, Symbol, RegExp，Date等内置对象

2. 不支持NaN，Infinity, undefined

3. 循环引用报错

4. 重写对象的constructor为function Object() {}



项目运行
npm i

http-server

