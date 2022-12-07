/*
 * @Description:注册Vue.component和Vue.directive
 * @version:
 * @Author: Murphy
 * @Date: 2022-07-02 12:30:56
 * @LastEditTime: 2022-09-21 16:50:18
 */
/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters(Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  // definition是用户传入的
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        // 直接返回已注册的全局组件/指令/过滤器，在global-api.js中设置了存储
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          // 确保有name属性
          definition.name = definition.name || id
          // 把组件配置转换成组件的构造函数
          // this.options._base Vue构造函数
          // 因为是静态方法，所以this.options._base.extend等价于调用 Vue.extend(definition)，并把该返回值放入 Vue.options['components'] 对象中。
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 全局注册，存储资源并赋值
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
