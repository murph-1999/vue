/*
 * @Description:
 * @version:
 * @Author: Murphy
 * @Date: 2022-07-02 12:30:56
 * @LastEditTime: 2022-09-18 17:26:03
 */
/* @flow */

import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'
// baseOptions 与web平台相关的内容
const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
