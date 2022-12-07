/*
 * @Description:
 * @version:
 * @Author: Murphy
 * @Date: 2022-07-02 12:30:56
 * @LastEditTime: 2022-10-27 20:28:46
 */
/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// 使用数组的原型对象创建一个新的对象
export const arrayMethods = Object.create(arrayProto)
// 修改数组元素的方法，共同特征：都会修改原数组，有这七个
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  // 给arrayMethods每个方法重新注入对应的方法，也就是def的第三个参数function，function中传入的参数是调用数组方法传入的参数
  def(arrayMethods, method, function mutator(...args) {
    // 执行数组的原始方法
    const result = original.apply(this, args)
    // 获取数组对象的observe对象
    const ob = this.__ob__
    // 处理会给数组新增元素的方法
    // 存储数组中新增的元素
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 对插入的新元素，重新遍历数组每个元素并设置为响应式数据
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 调用数组的ob对象发送通知
    ob.dep.notify()
    return result
  })
})
