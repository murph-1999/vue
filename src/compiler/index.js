/*
 * @Description:
 * @version:
 * @Author: Murphy
 * @Date: 2022-07-02 12:30:56
 * @LastEditTime: 2022-09-18 17:49:44
 */
/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 把模版转换成ast抽象语法树
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    // 优化抽象语法树
    optimize(ast, options)
  }
  // 把ast生成字符串形式转化成js代码
  const code = generate(ast, options)
  // 此时的render是字符串形式的，还未转化成方法
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
