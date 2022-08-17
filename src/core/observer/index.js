/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving(value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  // 观测对象
  value: any;
  // 依赖对象
  dep: Dep;
  // 实例计数器
  vmCount: number; // number of vms that have this object as root $data

  constructor(value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 将实例挂载到观察对象的__ob__属性，不可枚举，只是用来记录observer对象
    def(value, '__ob__', this)
    // 数组的响应式处理
    if (Array.isArray(value)) {
      // 判断当前浏览器是否有对象原型
      // 修补会改变原数组的方法，当这些方法调用时，调用dep.notify，通知更新视图
      // 修补后的方法设置到数组对象的原型上
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        // 若不支持__proto__
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 为数组中的对象元素创建一个observer实例，
      this.observeArray(value)
    } else {
      // 遍历对象中的每一个属性，转换何曾getter/setter
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk(obj: Object) {
    // 获取对象的每一个属性
    const keys = Object.keys(obj)
    // 遍历每一个属性，设置为响应式数据
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  // 数组的响应式处理
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment(target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    // src[key]对应的是修补后的数组方法
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe(value: any, asRootData: ?boolean): Observer | void {
  // 判断value是否是对象
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 如果value有__ob__ 属性，相当于做过响应式处理
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 创建一个observer对象
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
// 为一个对象定义一个响应式的属性
// shallow表示是否深度监听
export function defineReactive(
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 创建依赖对象实例，用来收集依赖于当前属性的订阅者 watcher
  // 每个属性都有对应的dep
  // 收集每个属性的依赖
  const dep = new Dep()
  // 获取 obj 的属性描述符对象
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // 提供预定义的存取器函数
  // 可能用户自定义了
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  // 判断是否深度监听，递归观察子对象，并将子对象属性都转换成getter/setter。返回子观察数据
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      // 先调用用户传入的getter， 存在则value等于getter 调用的返回值
      // 否则直接赋予属性值
      const value = getter ? getter.call(obj) : val
      // 如果存在当前依赖目标，即watcher对象存在，则建立依赖
      if (Dep.target) {
        //
        dep.depend()
        // 如果存在子观察目标存在，建立子对象的依赖关系
        if (childOb) {
          // 为子对象收集依赖，这个dep跟当前属性的dep是不同的，以数组为例，数组的dep对应的数组本身，为什么要给子对象加上dep呢？因为子对象添加删除等操作也需要是响应式，也就是数组的元素发生改变时也需要发送通知，$set $delete
          childOb.dep.depend()
          //属性是数组时，则特殊处理收集数组对象依赖
          if (Array.isArray(value)) {
            // 数组中的元素也是对象时，也要变成响应式，如果是数组，继续递归
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      // 使用预定义的getter获取旧值value
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 若新值等于旧值或者新值旧值为nan时不执行，因为nan不等于自身
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 若新值是对象，观察子对象并返回子的observer对象
      childOb = !shallow && observe(newVal)
      // 派发更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set(target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 判断target是否是数组，key是否是合法的索引
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    // 通过splice对key位置的元素进行替换
    // splice在array.js中进行了响应式处理，是处理后的方法
    target.splice(key, 1, val)
    return val
  }
  // 如果对象中已经存在key则直接赋值
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 获取target中的observer对象
  const ob = (target: any).__ob__
  // 如果target是vue实例或者$data则直接返回
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  //如果ob不存在，target不是响应式对象 直接赋值
  if (!ob) {
    target[key] = val
    return val
  }
  // 把key设置为响应式属性
  defineReactive(ob.value, key, val)
  // 发送通知，因为子观察对象收集过依赖，所以这里可以派发更新
  // 例子中就是obj：{name：'zhp'}收集过依赖
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del(target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  // 确保是响应式对象
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    // 数组中的元素也是对象时，也要变成响应式，如果是数组，继续递归
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
