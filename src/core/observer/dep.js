/*
 * @Description:
 * @version:
 * @Author: Murphy
 * @Date: 2022-07-02 12:30:56
 * @LastEditTime: 2022-07-10 14:35:48
 */
/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0
// dep是个可观察对象，可以有多个指令订阅它
/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
// 发布者
export default class Dep {
  static target: ?Watcher;
  // dep实例id
  id: number;
  // dep实例对应的watcher对象/订阅者数组
  subs: Array<Watcher>;

  constructor() {
    this.id = uid++
    this.subs = []
  }

  // 添加新的订阅者 watcher 对象
  addSub(sub: Watcher) {
    this.subs.push(sub)
  }
  // 移除订阅者
  removeSub(sub: Watcher) {
    remove(this.subs, sub)
  }


  depend() {
    if (Dep.target) {
      // this是属性对应的dep
      Dep.target.addDep(this)
    }
  }

  notify() {
    // stabilize the subscriber list first
    // 克隆数组
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      // 按照watcher的创建顺序进行排序
      subs.sort((a, b) => a.id - b.id)
    }
    // 调用每个订阅者的update方法实现更新
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// Dep.target 用来存放正在使用的watcher
// 全局唯一，并且一次也只能有一个watcher被使用
// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

// 入栈并将当前watcher赋值给Dep.target
// 为什么要使用到栈，因为组件可能是嵌套的
// 父子组件嵌套的时候先把父组件对应的watcher入栈
// 再去处理子组件的watcher，子组件处理完成后，载把父组件对应的watcher出栈
export function pushTarget(target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  // 出栈操作
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
